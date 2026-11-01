import { defineStore } from 'pinia'
import type { User, TravelBook } from '@/types'
import { mockUser, mockTravelBooks } from '@/mock'

interface AppState {
  token: string
  user: User | null
  travelBooks: TravelBook[]
  useMock: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    token: '',
    user: null,
    travelBooks: [],
    useMock: true // 前端独立开发时走 mock，联调后置 false
  }),
  getters: {
    isLogin: (state) => !!state.token || !!state.user,
    hasTravelBook: (state) => state.travelBooks.length > 0
  },
  actions: {
    // 初始化：mock 模式下直接填充数据
    init() {
      if (this.useMock) {
        this.user = mockUser
        this.travelBooks = mockTravelBooks
        this.token = 'mock-token'
      }
    },
    setToken(token: string) {
      this.token = token
      uni.setStorageSync('token', token)
    },
    setUser(user: User) {
      this.user = user
    }
  }
})
