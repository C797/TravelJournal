import { defineStore } from 'pinia'

interface AdminUser {
  name: string
  role: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    user: null as AdminUser | null
  }),
  actions: {
    login(token: string, user: AdminUser) {
      this.token = token
      this.user = user
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }
})
