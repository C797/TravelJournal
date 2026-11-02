// 微信登录链路：uni.login 取 code → POST /auth/wx-login → 后端换 openid 并签发 token
// 昵称头像走微信官方合规方式：<button open-type="chooseAvatar"> + <input type="nickname">

import { authApi } from '@/api/auth'
import type { WxLoginResult } from '@/api/auth'
import type { User } from '@/types'

/**
 * 本地降级登录用的固定 code。
 * 小程序未配置 AppID 时使用：后端会生成恒定 openid，
 * 从而稳定映射到种子演示账号「旅行者小王」，反复登录不会每次生成新用户。
 */
export const LOCAL_DEV_CODE = 'local-dev-user'

const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refresh_token'
const CODE_KEY = 'wx_code'
const NICK_KEY = 'wx_nickname'
const AVATAR_KEY = 'wx_avatar'
/** 用户主动退出后置位，避免静默登录立刻把用户又登回去 */
const MANUAL_LOGOUT_KEY = 'manual_logout'

/**
 * 是否具备真实微信登录条件。
 * manifest 里 mp-weixin.appid 为空时，uni.login 拿到的 code 后端无法换 openid，
 * 这里直接用固定演示 code，保证本地联调始终是同一条账号数据。
 * 配置了真实 AppID 时，在 .env 里填 VITE_WX_APPID 即可切回真实登录。
 */
const WX_APPID = (import.meta.env.VITE_WX_APPID || '').trim()
export const HAS_WX_APPID = !!WX_APPID

// ==================== 会话存储 ====================

export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function getRefreshToken(): string {
  return uni.getStorageSync(REFRESH_KEY) || ''
}

/** 是否已登录（本地存在 token） */
export function isWxLoggedIn(): boolean {
  return !!getToken()
}

export function saveSession(token: string, refreshToken?: string) {
  uni.setStorageSync(TOKEN_KEY, token)
  if (refreshToken) uni.setStorageSync(REFRESH_KEY, refreshToken)
}

/** 仅清理令牌，保留昵称头像缓存与退出标记（token 过期时用） */
export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(REFRESH_KEY)
}

/** 用户主动退出后置位 */
export function markManualLogout() {
  uni.setStorageSync(MANUAL_LOGOUT_KEY, '1')
}

export function clearManualLogout() {
  uni.removeStorageSync(MANUAL_LOGOUT_KEY)
}

export function isManualLogout(): boolean {
  return uni.getStorageSync(MANUAL_LOGOUT_KEY) === '1'
}

/** 完整退出：清会话 + 清资料缓存 + 打退出标记 */
export function logoutWx() {
  clearToken()
  uni.removeStorageSync(CODE_KEY)
  uni.removeStorageSync(NICK_KEY)
  uni.removeStorageSync(AVATAR_KEY)
  markManualLogout()
}

/** 保存用户授权的昵称头像到本地（服务端同步由 store 负责） */
export function saveWxProfile(nickname: string, avatar: string) {
  if (nickname) uni.setStorageSync(NICK_KEY, nickname)
  if (avatar) uni.setStorageSync(AVATAR_KEY, avatar)
}

/** 读取本地保存的昵称头像 */
export function getWxProfile(): { nickname: string; avatar: string } {
  return {
    nickname: uni.getStorageSync(NICK_KEY) || '',
    avatar: uni.getStorageSync(AVATAR_KEY) || ''
  }
}

// ==================== 登录 ====================

/** 调用微信登录，拿到临时登录凭证 code */
export function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res: any) => {
        if (res?.code) resolve(res.code)
        else reject(new Error('未获取到微信登录凭证'))
      },
      fail: (err: any) => reject(new Error(err?.errMsg || '微信登录调用失败'))
    })
  })
}

/**
 * 取登录 code：
 * - 未配置 AppID：直接用固定演示 code，跳过 uni.login（开发者工具里 code 每次不同，会每次新建用户）
 * - 已配置 AppID：走真实 uni.login
 */
async function resolveCode(): Promise<{ code: string; degraded: boolean }> {
  if (!HAS_WX_APPID) {
    return { code: LOCAL_DEV_CODE, degraded: true }
  }
  try {
    const code = await wxLogin()
    return { code, degraded: false }
  } catch {
    // 真机上偶发 uni.login 失败时兜底，保证不会卡死在登录页
    return { code: LOCAL_DEV_CODE, degraded: true }
  }
}

export interface WxLoginSession extends WxLoginResult {
  /** 是否走了本地降级登录（未配置 AppID） */
  degraded: boolean
  userInfo: User
}

/**
 * 微信登录完整链路：code → 后端 → 真实 JWT。
 * 成功后写入本地会话，返回值交给 store 落状态。
 */
export async function loginWithWx(opts?: {
  nickname?: string
  avatar?: string
}): Promise<WxLoginSession> {
  const { code, degraded } = await resolveCode()

  let result: WxLoginResult
  try {
    result = await authApi.wxLogin(code, opts)
  } catch (e: any) {
    // 后端业务错误（账号禁用等）原样抛出，网络错误统一文案
    const msg = e?.message || ''
    throw new Error(msg && !/request:fail|网络/.test(msg) ? msg : '登录失败，请检查网络后重试')
  }

  saveSession(result.token, result.refreshToken)
  uni.setStorageSync(CODE_KEY, code)
  clearManualLogout()

  return { ...result, degraded }
}
