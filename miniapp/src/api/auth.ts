import http from '@/utils/request'
import type { User } from '@/types'

export interface WxLoginResult {
  token: string
  refreshToken: string
  userInfo: User
  userIdCode: string
}

export const authApi = {
  /**
   * 微信登录：code → 后端换 openid + 签发 token。
   * noAuth：登录请求本身不需要带旧 token；
   * silent：失败提示由调用方统一展示，避免和页面 toast 重复。
   */
  wxLogin(code: string, opts?: { nickname?: string; avatar?: string }) {
    return http.post<WxLoginResult>(
      '/auth/wx-login',
      { code, ...opts },
      { noAuth: true, silent: true }
    )
  },

  /** 刷新 token */
  refreshToken(refreshToken: string) {
    return http.post<{ newToken: string }>('/auth/refresh-token', { refreshToken }, { silent: true })
  },

  /** 小程序登出：服务端仅记录，JWT 无状态 */
  logout() {
    return http.post<{ success: boolean }>(
      '/auth/logout',
      {},
      { silent: true, skipAuthHandler: true }
    )
  }
}

export const userApi = {
  /** 当前用户信息 */
  me() {
    return http.get<User>('/users/me')
  },

  /** 更新昵称 / 头像 / 签名 */
  updateMe(data: { nickname?: string; avatar?: string; signature?: string }) {
    return http.put<User>('/users/me', data)
  },

  /** 我的内容统计 */
  stats() {
    return http.get<{ travelBooks: number; journals: number; spots: number; bills: number }>(
      '/users/me/stats'
    )
  },

  /** 我的全部标注点（跨旅行册，首页足迹地图用） */
  mySpots() {
    return http.get<import('@/types').MapSpot[]>('/users/me/spots')
  },

  /** 我的最近游记（首页最近故事） */
  myJournals(limit = 5) {
    return http.get<import('@/types').Journal[]>('/users/me/journals', { limit })
  },

  /** 可邀请的人（共同旅行册成员） */
  myFriends() {
    return http.get<import('@/types').User[]>('/users/me/friends')
  }
}
