// 通用工具函数

/**
 * 千分位格式化（手写实现，避免微信 JS 引擎对 toLocaleString 参数支持不一致）
 * formatNumber(8560.5, 2) -> '8,560.50'
 */
export function formatNumber(n: number, digits = 0): string {
  const num = Number.isFinite(n) ? n : 0
  const fixed = Math.abs(num).toFixed(digits)
  const [intPart, decPart] = fixed.split('.')
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = num < 0 ? '-' : ''
  return sign + withSep + (decPart ? '.' + decPart : '')
}

export function formatMoney(n: number): string {
  return '¥' + formatNumber(n ?? 0, 2)
}

export function formatMoneyInt(n: number): string {
  return '¥' + formatNumber(Math.round(n ?? 0), 0)
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
