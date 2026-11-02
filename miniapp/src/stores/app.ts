import { defineStore } from 'pinia'
import type { User, TravelBook } from '@/types'
import { mockUser, mockTravelBooks } from '@/mock'
import { authApi, userApi } from '@/api/auth'
import { bookApi } from '@/api/book'
import {
  loginWithWx,
  getWxProfile,
  saveWxProfile,
  logoutWx,
  isWxLoggedIn,
  isManualLogout,
  clearManualLogout,
  clearToken
} from '@/utils/wechat-auth'

interface AppState {
  token: string
  user: User | null
  travelBooks: TravelBook[]
  /** 后端未就绪时的前端 mock 兜底开关；接入真实接口后保持 false */
  useMock: boolean
  wxLoggedIn: boolean
  /** 正在进行的登录 Promise，避免并发重复登录 */
  loginTask: Promise<any> | null
  /** 登录请求进行中，按钮可显示 loading */
  logging: boolean
  ready: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    token: '',
    user: null,
    travelBooks: [],
    useMock: false,
    wxLoggedIn: false,
    loginTask: null,
    logging: false,
    ready: false
  }),

  getters: {
    isLogin: (state) => !!state.token,
    hasTravelBook: (state) => state.travelBooks.length > 0,

    /** 展示用昵称：用户资料 > 本地授权缓存 > 占位（未登录不读缓存，避免退出后残留） */
    displayName: (state) => {
      if (!state.token) return '旅行者'
      const wx = getWxProfile()
      return state.user?.nickname || wx.nickname || '旅行者'
    },

    /** 展示用头像：用户资料 > 本地授权缓存 > 空 */
    displayAvatar: (state) => {
      if (!state.token) return ''
      const wx = getWxProfile()
      return state.user?.avatar || wx.avatar || ''
    },

    /** 是否需要引导用户授权昵称头像（登录了但没设置过昵称） */
    needProfile: (state) => {
      if (!state.token) return false
      const name = state.user?.nickname || ''
      // 后端默认昵称为「旅行者」，视为未授权
      return !name || name === '旅行者'
    },

    /** 我的页展示用的用户 ID 码 */
    userIdCode: (state) => state.user?.userIdCode || ''
  },

  actions: {
    /**
     * 应用初始化：恢复本地 token → 拉用户信息与旅行册。
     * 这里不做自动登录，登录时机由页面通过 ensureLogin() 决定。
     */
    async init() {
      if (this.useMock) {
        this.user = mockUser
        this.travelBooks = mockTravelBooks
        this.token = 'mock-token'
        this.wxLoggedIn = true
        this.ready = true
        return
      }

      this.token = uni.getStorageSync('token') || ''
      this.wxLoggedIn = isWxLoggedIn()

      if (this.token) {
        await Promise.all([this.loadUser(), this.loadBooks()])
      }
      this.ready = true
    },

    /**
     * 确保已登录：无 token 时静默执行微信登录（openid 登录无需用户授权）。
     * 用户主动退出后不再自动登录，需回「我的」点击微信登录。
     * 同一时刻只发起一次，避免多个页面并发触发。
     */
    async ensureLogin(): Promise<void> {
      if (this.useMock) return
      if (this.token) return
      if (isManualLogout()) return
      if (this.loginTask) return this.loginTask

      this.loginTask = (async () => {
        try {
          const res = await loginWithWx()
          this.token = res.token
          this.wxLoggedIn = true
          if (res.userInfo) this.user = res.userInfo as User
          await this.loadBooks()
        } catch {
          // 静默登录失败不阻断页面渲染，页面显示空态即可
          this.token = ''
          this.wxLoggedIn = false
        } finally {
          this.loginTask = null
        }
      })()

      return this.loginTask
    },

    /** 拉取当前用户信息 */
    async loadUser() {
      if (this.useMock) return this.user
      try {
        const u = await userApi.me()
        this.user = u
        return u
      } catch {
        return null
      }
    },

    /** 拉取我的旅行册列表 */
    async loadBooks() {
      if (this.useMock) return this.travelBooks
      try {
        const list = await bookApi.list()
        this.travelBooks = list
        return list
      } catch {
        return []
      }
    },

    setToken(token: string) {
      this.token = token
      uni.setStorageSync('token', token)
    },

    setUser(user: User) {
      this.user = user
    },

    /**
     * 主动登录（「我的」页「微信登录」按钮）。
     * 与 ensureLogin 的区别：由用户点击触发，错误抛给调用方展示，
     * 并且会清掉退出标记，允许重新登录。
     */
    async loginByWx(opts?: { nickname?: string; avatar?: string }) {
      if (this.loginTask) return this.loginTask

      this.logging = true
      this.loginTask = (async () => {
        try {
          clearManualLogout()
          const res = await loginWithWx(opts)
          this.token = res.token
          this.wxLoggedIn = true
          this.user = res.userInfo as User
          await this.loadBooks()
          return res
        } finally {
          this.logging = false
          this.loginTask = null
        }
      })()

      return this.loginTask
    },

    /** 保存微信昵称头像：本地缓存 + 同步服务端 */
    async updateProfile(nickname: string, avatar: string) {
      saveWxProfile(nickname, avatar)
      if (this.user) {
        if (nickname) this.user.nickname = nickname
        if (avatar) this.user.avatar = avatar
      }
      if (this.useMock || !this.token) return
      try {
        const updated = await userApi.updateMe({
          ...(nickname ? { nickname } : {}),
          ...(avatar ? { avatar } : {})
        })
        if (updated) this.user = updated
      } catch {
        // 同步失败不影响本地展示
      }
    },

    /** 退出登录：通知服务端 → 清本地会话 → 置退出标记 */
    async logout() {
      if (this.token && !this.useMock) {
        // 通知失败不阻断退出，本地清干净即可
        await authApi.logout().catch(() => null)
      }

      logoutWx()
      this.wxLoggedIn = false
      this.token = ''
      this.user = null
      this.travelBooks = []

      if (this.useMock) {
        this.user = mockUser
        this.travelBooks = mockTravelBooks
        this.token = 'mock-token'
      }
    },

    /** token 失效时的轻量清理（保留昵称头像缓存） */
    clearSession() {
      clearToken()
      this.token = ''
      this.user = null
      this.travelBooks = []
    }
  }
})
