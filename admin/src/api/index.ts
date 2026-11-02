import request from '@/utils/request'

/* ==================== 类型 ==================== */

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminInfo {
  id: string
  account: string
  name: string
  role: 'super' | 'admin' | 'reviewer'
}

export interface DashboardCard {
  key: string
  label: string
  value: number
  ratio: number | null
  unit: string
}

export interface DashboardTrendItem {
  date: string
  label: string
  users: number
  journals: number
}

export interface DashboardCompositionItem {
  name: string
  value: number
  count: number
  color: string
}

export interface DashboardUserRow {
  id: string
  nickname: string
  avatar: string
  phone: string
  userIdCode: string
  role: string
  status: string
  statusText: string
  books: number
  createdAt: string
  initial: string
}

export interface DashboardSummary {
  cards: DashboardCard[]
  pendingJournals: number
  trend: DashboardTrendItem[]
  composition: DashboardCompositionItem[]
  recentUsers: DashboardUserRow[]
}

export interface UserRow {
  id: string
  nickname: string
  avatar: string
  phone: string
  userIdCode: string
  role: string
  status: string
  statusText: string
  books: number
  journals: number
  createdAt: string
  initial: string
}

export interface BookRow {
  id: string
  name: string
  coverUrl: string
  owner: string
  ownerId: string
  spots: number
  journals: number
  members: number
  bookIsPublic: boolean
  status: string
  statusText: string
  startTime: string | null
  endTime: string | null
  createdAt: string
}

export interface JournalRow {
  id: string
  title: string
  author: string
  authorId: string
  book: string
  bookId: string
  words: number
  imageCount: number
  isPublic: boolean
  auditStatus: 'pending' | 'pass' | 'reject'
  statusText: string
  travelDate: string | null
  createdAt: string
}

export interface LedgerRow {
  id: string
  name: string
  book: string
  bookId: string
  members: number
  bills: number
  totalExpense: number
  status: string
  statusText: string
  createdAt: string
}

export interface SystemConfigs {
  siteName: string
  contactEmail: string
  servicePhone: string
  auditJournal: boolean
  auditImage: boolean
  auditUser: boolean
}

export interface LogRow {
  id: string
  adminId: string | null
  adminName: string | null
  module: string
  action: string
  targetId: string | null
  content: string
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export interface AdminAccountRow {
  id: string
  account: string
  name: string
  role: string
  roleText: string
  status: string
  statusText: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
}

/* ==================== 认证 ==================== */

export const authApi = {
  login(account: string, password: string) {
    return request.post<any, { token: string; adminInfo: AdminInfo }>('/auth/admin/login', {
      account,
      password
    })
  },
  profile() {
    return request.get<any, AdminInfo>('/auth/admin/profile')
  },
  logout() {
    return request.post('/auth/admin/logout')
  }
}

/* ==================== 看板 ==================== */

export const dashboardApi = {
  summary() {
    return request.get<any, DashboardSummary>('/admin/dashboard')
  }
}

/* ==================== 用户 ==================== */

export const userApi = {
  list(params: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
    return request.get<any, PageResult<UserRow>>('/admin/users', { params })
  },
  detail(id: string) {
    return request.get<any, any>(`/admin/users/${id}`)
  },
  updateStatus(id: string, status: 'normal' | 'disabled') {
    return request.put(`/admin/users/${id}/status`, { status })
  },
  remove(id: string) {
    return request.delete(`/admin/users/${id}`)
  }
}

/* ==================== 旅行册 ==================== */

export const bookApi = {
  list(params: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
    return request.get<any, PageResult<BookRow>>('/admin/travel-books', { params })
  },
  detail(id: string) {
    return request.get<any, any>(`/admin/travel-books/${id}`)
  },
  updateStatus(id: string, status: 'normal' | 'offline') {
    return request.put(`/admin/travel-books/${id}/status`, { status })
  },
  remove(id: string) {
    return request.delete(`/admin/travel-books/${id}`)
  }
}

/* ==================== 游记 ==================== */

export const journalApi = {
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    auditStatus?: string
  }) {
    return request.get<any, PageResult<JournalRow>>('/admin/journals', { params })
  },
  detail(id: string) {
    return request.get<any, any>(`/admin/journals/${id}`)
  },
  audit(id: string, auditStatus: 'pass' | 'reject' | 'pending') {
    return request.put(`/admin/journals/${id}/audit`, { auditStatus })
  },
  remove(id: string) {
    return request.delete(`/admin/journals/${id}`)
  }
}

/* ==================== 账本 ==================== */

export const ledgerApi = {
  list(params: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
    return request.get<any, PageResult<LedgerRow>>('/admin/ledgers', { params })
  },
  detail(id: string) {
    return request.get<any, any>(`/admin/ledgers/${id}`)
  },
  updateStatus(id: string, status: 'normal' | 'disabled') {
    return request.put(`/admin/ledgers/${id}/status`, { status })
  },
  remove(id: string) {
    return request.delete(`/admin/ledgers/${id}`)
  }
}

/* ==================== 系统 ==================== */

export const systemApi = {
  getConfigs() {
    return request.get<any, SystemConfigs>('/admin/system/configs')
  },
  saveConfigs(data: SystemConfigs) {
    return request.put<any, SystemConfigs>('/admin/system/configs', data)
  },
  logs(params: {
    page?: number
    pageSize?: number
    module?: string
    keyword?: string
    startDate?: string
    endDate?: string
  }) {
    return request.get<any, PageResult<LogRow>>('/admin/logs', { params })
  },
  accounts() {
    return request.get<any, AdminAccountRow[]>('/admin/accounts')
  },
  createAccount(data: { account: string; password: string; name: string; role?: string }) {
    return request.post('/admin/accounts', data)
  },
  resetPassword(id: string, password: string) {
    return request.put(`/admin/accounts/${id}/password`, { password })
  },
  updateAccountStatus(id: string, status: 'normal' | 'disabled') {
    return request.put(`/admin/accounts/${id}/status`, { status })
  }
}
