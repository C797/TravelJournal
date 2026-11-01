// 途记 TravelJournal 核心类型定义（字段对齐开发文档 V1.4）

export interface User {
  id: string
  openid?: string
  nickname: string
  avatar?: string
  signature?: string
  userIdCode?: string
  phone?: string
  status: 'normal' | 'disabled'
  createdAt?: string
}

export type MemberRole = 'creator' | 'admin' | 'member'

export interface TravelBook {
  id: string
  coverUrl?: string
  name: string
  startTime: string
  endTime: string
  bookIsPublic: boolean
  ownerId: string
  createdAt?: string
  // 派生统计
  journalCount?: number
  spotCount?: number
  tripDays?: number
  yearMonth?: string
}

export interface TravelBookMember {
  id: string
  bookId: string
  userId: string
  role: MemberRole
  joinedAt: string
  user?: User
}

export type MarkStatus = 'visited' | 'planned'

export interface MapSpot {
  id: string
  bookId: string
  locationName: string
  province?: string
  city?: string
  longitude?: number
  latitude?: number
  markStatus: MarkStatus
  visitDate?: string
  journalCount?: number
  createdAt?: string
}

export interface JournalImage {
  id: string
  journalId: string
  url: string
  sort: number
}

export type AuditStatus = 'pass' | 'pending' | 'reject'

export interface Journal {
  id: string
  bookId: string
  spotId?: string
  userId: string
  title: string
  travelDate: string
  weather?: string
  locationName?: string
  content: string
  isPublic: boolean
  auditStatus: AuditStatus
  createdAt?: string
  updatedAt?: string
  images?: JournalImage[]
  book?: TravelBook
  dayIndex?: number
  totalDays?: number
}

export interface Ledger {
  id: string
  bookId: string
  name: string
  ownerId: string
  createdAt?: string
  // 统计
  monthExpense?: number
  monthIncome?: number
  monthBalance?: number
  todayExpense?: number
  totalExpense?: number
  avgExpense?: number
  billCount?: number
}

export interface LedgerMember {
  id: string
  ledgerId: string
  userId: string
  role: MemberRole
  joinedAt: string
  user?: User
}

export type BillCategory = '餐饮' | '交通' | '住宿' | '门票' | '购物' | '其他'
export type BillType = 'expense' | 'income'

export interface Bill {
  id: string
  ledgerId: string
  userId: string
  category: BillCategory
  subCategory?: string
  billType: BillType
  amount: number
  remark?: string
  payWay?: string
  billDate: string
  createdAt?: string
}

export interface Invitation {
  id: string
  code: string
  ledgerId: string
  creatorId: string
  expireAt: string
  used: boolean
}

export interface StatsItem {
  label: string
  value: number
}

export interface LedgerStats {
  totalExpense: number
  prevPeriodRatio?: number
  categoryRatio: { name: string; value: number }[]
  dailyTrend: { date: string; value: number }[]
  avgExpense: number
  memberCount: number
}
