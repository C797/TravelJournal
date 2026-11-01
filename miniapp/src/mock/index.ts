// Mock 数据（对齐 UI 设计图，用于前端独立开发与预览）
import type {
  User, TravelBook, MapSpot, Journal, Ledger, Bill, LedgerMember, Invitation
} from '@/types'

export const mockUser: User = {
  id: 'u-10086',
  nickname: '旅行者小王',
  avatar: '',
  signature: '把世界装进记忆里',
  userIdCode: '10086',
  status: 'normal'
}

export const mockTravelBooks: TravelBook[] = [
  {
    id: 'tb-1',
    name: '川西之旅',
    coverUrl: '',
    startTime: '2025-06-01',
    endTime: '2025-06-15',
    bookIsPublic: false,
    ownerId: 'u-10086',
    journalCount: 12,
    spotCount: 6,
    tripDays: 15,
    yearMonth: '06/2025'
  },
  {
    id: 'tb-2',
    name: '厦门慢时光',
    coverUrl: '',
    startTime: '2025-02-10',
    endTime: '2025-02-16',
    bookIsPublic: false,
    ownerId: 'u-10086',
    journalCount: 8,
    spotCount: 5,
    tripDays: 7,
    yearMonth: '02/2025'
  },
  {
    id: 'tb-3',
    name: '云南之南',
    coverUrl: '',
    startTime: '2024-09-20',
    endTime: '2024-09-30',
    bookIsPublic: false,
    ownerId: 'u-10086',
    journalCount: 6,
    spotCount: 7,
    tripDays: 11,
    yearMonth: '09/2024'
  }
]

export const mockSpots: MapSpot[] = [
  { id: 's-1', bookId: 'tb-1', locationName: '色达 · 五明佛学院', province: '四川', city: '甘孜', markStatus: 'visited', visitDate: '2024-10-03', journalCount: 1 },
  { id: 's-2', bookId: 'tb-1', locationName: '稻城 · 亚丁村', province: '四川', city: '稻城', markStatus: 'visited', visitDate: '2024-10-05', journalCount: 3 },
  { id: 's-3', bookId: 'tb-1', locationName: '康定 · 木格措', province: '四川', city: '康定', markStatus: 'planned', journalCount: 0 },
  { id: 's-4', bookId: 'tb-1', locationName: '成都 · 宽窄巷子', province: '四川', city: '成都', markStatus: 'visited', visitDate: '2024-10-01', journalCount: 5 }
]

export const mockJournals: Journal[] = [
  {
    id: 'j-1', bookId: 'tb-1', userId: 'u-10086',
    title: '雪山与湖的约定', travelDate: '2025-06-12', weather: '晴朗 12℃',
    locationName: '四川 · 九寨沟', content: '把夏天留在这一刻。', isPublic: true,
    auditStatus: 'pass', images: []
  },
  {
    id: 'j-2', bookId: 'tb-1', userId: 'u-10086',
    title: '色达，信仰的红色之城', travelDate: '2024-10-03', weather: '多云转晴 8℃',
    locationName: '四川 · 甘孜色达', content: '层层叠叠的红房子，在夕阳里慢慢地发亮。',
    isPublic: false, auditStatus: 'pass', images: []
  },
  {
    id: 'j-3', bookId: 'tb-1', userId: 'u-10086',
    title: '稻城亚丁，最后的净土', travelDate: '2024-10-05', weather: '晴朗 6℃',
    locationName: '四川 · 稻城亚丁', content: '牛奶海像一颗蓝宝石嵌在央迈勇雪山之间。',
    isPublic: true, auditStatus: 'pass', images: []
  },
  {
    id: 'j-4', bookId: 'tb-1', userId: 'u-10086',
    title: '折多山垭口的云海', travelDate: '2024-10-01', weather: '多云 4℃',
    locationName: '四川 · 康定折多山', content: '云海在脚下铺开，经幡被风吹得很响。',
    isPublic: false, auditStatus: 'pass', images: []
  },
  {
    id: 'j-5', bookId: 'tb-1', userId: 'u-10086',
    title: '云雾里的梅里雪山', travelDate: '2024-09-28', weather: '小雨 5℃',
    locationName: '云南 · 迪庆梅里', content: '晨雾散开，露出远处雪山的轮廓。',
    isPublic: false, auditStatus: 'pass', images: []
  }
]

export const mockLedger: Ledger = {
  id: 'l-1',
  bookId: 'tb-1',
  name: '川西之旅账本',
  ownerId: 'u-10086',
  monthExpense: 8642,
  monthIncome: 1280,
  monthBalance: 3518,
  todayExpense: 186.5,
  totalExpense: 4268,
  avgExpense: 1067,
  billCount: 32
}

export const mockBills: Bill[] = [
  { id: 'b-1', ledgerId: 'l-1', userId: 'u-10086', category: '餐饮', subCategory: '晚餐', billType: 'expense', amount: 86.0, remark: '藏式火锅', payWay: '微信支付', billDate: '2025-10-05' },
  { id: 'b-2', ledgerId: 'l-1', userId: 'u-10086', category: '交通', subCategory: '打车', billType: 'expense', amount: 35.5, remark: '客栈到景区', payWay: '微信支付', billDate: '2025-10-05' },
  { id: 'b-3', ledgerId: 'l-1', userId: 'u-10086', category: '其他', subCategory: 'AA收款', billType: 'income', amount: 150.0, remark: '小明分摊', payWay: '', billDate: '2025-10-05' },
  { id: 'b-4', ledgerId: 'l-1', userId: 'u-10086', category: '门票', subCategory: '亚丁景区', billType: 'expense', amount: 270.0, remark: '景区门票 · 2人', payWay: '支付宝', billDate: '2025-10-05' },
  { id: 'b-5', ledgerId: 'l-1', userId: 'u-10086', category: '住宿', subCategory: '理塘酒店', billType: 'expense', amount: 380.0, remark: '含早 · 2晚', payWay: '微信支付', billDate: '2025-10-04' },
  { id: 'b-6', ledgerId: 'l-1', userId: 'u-10086', category: '购物', subCategory: '街角小店', billType: 'expense', amount: 28.0, remark: '手冲 · 1杯', payWay: '微信支付', billDate: '2025-10-04' }
]

export const mockLedgerMembers: LedgerMember[] = [
  { id: 'm-1', ledgerId: 'l-1', userId: 'u-10086', role: 'creator', joinedAt: '2025-06-01', user: { id: 'u-10086', nickname: '旅行者小王', signature: '', status: 'normal' } },
  { id: 'm-2', ledgerId: 'l-1', userId: 'u-2', role: 'admin', joinedAt: '2025-06-03', user: { id: 'u-2', nickname: '周同学', signature: '', status: 'normal' } },
  { id: 'm-3', ledgerId: 'l-1', userId: 'u-3', role: 'member', joinedAt: '2025-06-05', user: { id: 'u-3', nickname: '陈小姐', signature: '', status: 'normal' } }
]

export const mockInvitation: Invitation = {
  id: 'inv-1',
  code: 'QJ8K 26',
  ledgerId: 'l-1',
  creatorId: 'u-10086',
  expireAt: '2025-06-20 23:59',
  used: false
}

// 首页"我的足迹地图"点位（汇总）
export const mockFootprintCities = [
  { name: '北京', status: 'visited' as const, lng: 116.4, lat: 39.9 },
  { name: '西安', status: 'visited' as const, lng: 108.9, lat: 34.3 },
  { name: '上海', status: 'visited' as const, lng: 121.47, lat: 31.23 },
  { name: '成都', status: 'visited' as const, lng: 104.06, lat: 30.67 },
  { name: '重庆', status: 'visited' as const, lng: 106.55, lat: 29.56 },
  { name: '武汉', status: 'visited' as const, lng: 114.3, lat: 30.59 },
  { name: '杭州', status: 'visited' as const, lng: 120.15, lat: 30.28 },
  { name: '昆明', status: 'visited' as const, lng: 102.71, lat: 25.04 },
  { name: '广州', status: 'visited' as const, lng: 113.26, lat: 23.13 },
  { name: '拉萨', status: 'planned' as const, lng: 91.14, lat: 29.65 },
  { name: '稻城', status: 'visited' as const, lng: 100.3, lat: 29.03 },
  { name: '色达', status: 'visited' as const, lng: 100.33, lat: 32.27 }
]
