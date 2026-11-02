import http from '@/utils/request'
import type { Ledger, Bill, LedgerMember, Invitation, LedgerStats } from '@/types'
import type { PageResult } from '@/utils/request'

export interface CreateBillPayload {
  ledgerId: string
  category: string
  subCategory?: string
  billType: 'expense' | 'income'
  amount: number
  remark?: string
  payWay?: string
  billDate: string
}

export const ledgerApi = {
  /**
   * 新建/更新账本（账本与旅行册 1:1，同册再次提交视为改名）。
   */
  create(input: {
    bookId: string
    name: string
    isPublic?: boolean
    memberIds?: string[]
  }) {
    return http.post<Ledger>('/ledgers', input)
  },

  /** 按旅行册取账本（含本月收支、今日消费、账单数等统计） */
  getByBook(bookId: string) {
    return http.get<Ledger>(`/travel-books/${bookId}/ledger`)
  },

  members(ledgerId: string) {
    return http.get<LedgerMember[]>(`/ledgers/${ledgerId}/members`)
  },

  removeMember(ledgerId: string, userId: string) {
    return http.del<{ success: boolean }>(`/ledgers/${ledgerId}/members/${userId}`)
  },

  /** 收支统计：scope = week | month | year */
  stats(ledgerId: string, scope: 'week' | 'month' | 'year' = 'month') {
    return http.get<LedgerStats>(`/ledgers/${ledgerId}/stats`, { scope })
  },

  exportBills(ledgerId: string, startDate?: string, endDate?: string) {
    return http.get<{ downloadUrl: string; billCount: number; bills: Bill[] }>(
      `/ledgers/${ledgerId}/export`,
      { startDate, endDate }
    )
  }
}

export const billApi = {
  /** 账单列表。注意：后端 Prisma Decimal 序列化后为字符串，这里统一转成 number */
  async list(
    ledgerId: string,
    page = 1,
    pageSize = 20,
    startDate?: string,
    endDate?: string
  ): Promise<PageResult<Bill>> {
    const res = await http.get<PageResult<Bill>>(`/ledgers/${ledgerId}/bills`, {
      page,
      pageSize,
      startDate,
      endDate
    })
    return { ...res, list: (res.list || []).map(normalizeBill) }
  },

  async create(data: CreateBillPayload): Promise<Bill> {
    const bill = await http.post<Bill>('/bills', data)
    return normalizeBill(bill)
  },

  async update(id: string, data: Partial<CreateBillPayload>): Promise<Bill> {
    const bill = await http.put<Bill>(`/bills/${id}`, data)
    return normalizeBill(bill)
  },

  remove(id: string) {
    return http.del<{ success: boolean }>(`/bills/${id}`)
  }
}

/** 把后端返回的字符串金额统一成 number */
function normalizeBill(b: Bill): Bill {
  return { ...b, amount: Number(b.amount) || 0 }
}

export const invitationApi = {
  /** 生成邀请码（仅账本创建者） */
  generate(ledgerId: string, expireHours = 72) {
    return http.post<Invitation>('/invitations', { ledgerId, expireHours })
  },

  verify(code: string) {
    return http.post<{ ledgerName?: string; bookName?: string }>(
      '/invitations/verify',
      { code },
      { noAuth: true }
    )
  },

  join(code: string) {
    return http.post<{ success: boolean; ledgerId: string }>('/invitations/join', { code })
  }
}
