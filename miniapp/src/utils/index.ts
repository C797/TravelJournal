// 通用工具函数
export function formatMoney(n: number): string {
  return '¥' + (n ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatMoneyInt(n: number): string {
  return '¥' + Math.round(n ?? 0).toLocaleString('zh-CN')
}

// 计算两个日期之间的自然天数（含首尾）
export function calcDays(start: string, end: string): number {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (!s || !e || e < s) return 0
  return Math.round((e - s) / (24 * 3600 * 1000)) + 1
}

export function formatDate(d: string): string {
  if (!d) return ''
  const t = new Date(d)
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const day = String(t.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export function formatMonthYear(d: string): string {
  if (!d) return ''
  const t = new Date(d)
  const m = String(t.getMonth() + 1).padStart(2, '0')
  return `${m}/${t.getFullYear()}`
}
