import { defineStore } from 'pinia'
import { authApi } from '@/api'
import type { AdminInfo } from '@/api'

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

const ROLE_TEXT: Record<string, string> = {
  super: '超级管理员',
  admin: '管理员',
  reviewer: '审核员'
}

function readUser(): AdminInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AdminInfo) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: readUser()
  }),

  getters: {
    isLogin: (s) => !!s.token,
    name: (s) => s.user?.name || '管理员',
    role: (s) => s.user?.role || '',
    roleText: (s) => ROLE_TEXT[s.user?.role || ''] || '管理员',
    /** super 拥有全部权限 */
    isSuper: (s) => s.user?.role === 'super',
    /** 审核员只读，不能执行写操作 */
    canWrite: (s) => s.user?.role !== 'reviewer',
    initial: (s) => (s.user?.name || '管').slice(0, 1)
  },

  actions: {
    async login(account: string, password: string) {
      const data = await authApi.login(account.trim(), password)
      this.token = data.token
      this.user = data.adminInfo
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.adminInfo))
      return data.adminInfo
    },

    /** 刷新页面后用 token 拉一次最新管理员信息 */
    async fetchProfile() {
      if (!this.token) return null
      const info = await authApi.profile()
      this.user = info
      localStorage.setItem(USER_KEY, JSON.stringify(info))
      return info
    },

    async logout() {
      try {
        if (this.token) await authApi.logout()
      } catch {
        // 忽略：本地清理优先
      }
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }
})
