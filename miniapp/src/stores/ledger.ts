import { defineStore } from 'pinia'
import type { Ledger } from '@/types'
import { ledgerApi } from '@/api/ledger'
import { bookApi } from '@/api/book'

const STORAGE_CURRENT = 'tj_ledger_current'

interface LedgerState {
  ledgers: Ledger[]
  currentId: string
  /** 是否已加载过一次 */
  ready: boolean
  loading: boolean
}

/**
 * 账本列表跨页共享：账本首页、记账页、成员页共用同一份数据。
 * 数据来源：我的旅行册 → 每本旅行册对应的账本（1:1）。
 */
export const useLedgerStore = defineStore('ledger', {
  state: (): LedgerState => ({
    ledgers: [],
    currentId: '',
    ready: false,
    loading: false
  }),

  getters: {
    current(state): Ledger | null {
      return state.ledgers.find((l) => l.id === state.currentId) || state.ledgers[0] || null
    },

    /** 当前账本所属旅行册 id */
    currentBookId(): string {
      return this.current?.bookId || ''
    }
  },

  actions: {
    /**
     * 拉取全部账本：先取旅行册列表，再逐个取对应账本。
     * 旅行册数量有限（一般几位数），并行请求即可。
     */
    async load(force = false) {
      if (this.loading) return
      if (this.ready && !force) return
      this.loading = true
      try {
        const books = await bookApi.list()
        const results = await Promise.all(
          books.map((b) => ledgerApi.getByBook(b.id).catch(() => null))
        )
        this.ledgers = results.filter((l): l is Ledger => !!l)

        const saved = uni.getStorageSync(STORAGE_CURRENT) as string
        if (this.ledgers.some((l) => l.id === saved)) {
          this.currentId = saved
        } else if (!this.ledgers.some((l) => l.id === this.currentId)) {
          this.currentId = this.ledgers[0]?.id || ''
        }
        this.ready = true
      } finally {
        this.loading = false
      }
    },

    switchTo(id: string) {
      if (!this.ledgers.some((l) => l.id === id)) return
      this.currentId = id
      uni.setStorageSync(STORAGE_CURRENT, id)
    },

    /** 新建或更新账本后，把结果并回列表并切换过去 */
    async saveAndSwitch(input: {
      bookId: string
      name: string
      isPublic?: boolean
      memberIds?: string[]
    }) {
      const saved = await ledgerApi.create(input)
      // 后端返回的是账本基础信息，统计字段需要重新取一次
      const full = await ledgerApi.getByBook(input.bookId).catch(() => saved)

      const idx = this.ledgers.findIndex((l) => l.id === full.id)
      if (idx >= 0) this.ledgers.splice(idx, 1, full)
      else this.ledgers.unshift(full)

      this.currentId = full.id
      uni.setStorageSync(STORAGE_CURRENT, full.id)
      this.ready = true
      return full
    }
  }
})
