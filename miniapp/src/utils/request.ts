// 请求封装：基于 uni.request，统一 Base URL、token、错误处理
const RAW_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

/** 接口根地址，形如 http://localhost:3000/api */
export const BASE_URL = RAW_BASE.replace(/\/$/, '')

/** 服务根地址（用于拼接上传/静态资源），形如 http://localhost:3000 */
export const SERVER_URL = BASE_URL.replace(/\/api$/, '')

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  /** 静默模式：失败不弹 toast，由调用方自行处理 */
  silent?: boolean
  /** 不携带 token */
  noAuth?: boolean
  /** 401 时不做刷新/跳转（登出等主动清理场景） */
  skipAuthHandler?: boolean
}

/** 带状态码的请求错误，便于上层区分 401 / 403 */
export class HttpError extends Error {
  statusCode: number
  code: number
  constructor(message: string, statusCode: number, code = -1) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function getToken(): string {
  return uni.getStorageSync('token') || ''
}

let redirecting = false

/** 401 且刷新失败：清登录态并回首页（首页会重新走静默登录） */
function handleUnauthorized() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('refresh_token')
  if (redirecting) return
  redirecting = true
  setTimeout(() => {
    redirecting = false
  }, 2000)
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]?.route || ''
  if (!current.includes('pages/index/index')) {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

/**
 * 用 refresh token 换新 token。
 * 单飞：并发 401 只发一次刷新请求，其余请求共用结果。
 */
let refreshing: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (refreshing) return refreshing

  const refreshToken = uni.getStorageSync('refresh_token') || ''
  if (!refreshToken) return Promise.resolve('')

  refreshing = new Promise<string>((resolve) => {
    uni.request({
      url: `${BASE_URL}/auth/refresh-token`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      success: (res: any) => {
        const body = res.data as ApiResponse<{ newToken: string }>
        const ok = res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0
        if (ok && body.data?.newToken) {
          uni.setStorageSync('token', body.data.newToken)
          resolve(body.data.newToken)
        } else {
          resolve('')
        }
      },
      fail: () => resolve('')
    })
  }).then(
    (token) => {
      refreshing = null
      return token
    },
    () => {
      refreshing = null
      return ''
    }
  )

  return refreshing
}

/** 单次请求，不做兜底处理 */
function doRequest<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, noAuth = false } = options
  const token = noAuth ? '' : getToken()

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header
      },
      success: (res: any) => {
        const body = res.data as ApiResponse<T>
        if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
          resolve(body.data)
          return
        }
        reject(
          new HttpError(
            body?.message || `请求失败(${res.statusCode})`,
            res.statusCode,
            body?.code
          )
        )
      },
      fail: () => reject(new HttpError('网络异常，请检查网络', 0))
    })
  })
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  const { silent = false, noAuth = false, skipAuthHandler = false } = options

  try {
    return await doRequest<T>(options)
  } catch (e) {
    const err = e as HttpError

    // token 过期：先尝试静默刷新，成功则原请求重放一次
    if (err?.statusCode === 401 && !noAuth && !skipAuthHandler) {
      const token = await refreshAccessToken()
      if (token) {
        try {
          return await doRequest<T>(options)
        } catch (retryErr) {
          const e2 = retryErr as HttpError
          if (e2?.statusCode === 401) handleUnauthorized()
          if (!silent) uni.showToast({ title: e2.message || '请求失败', icon: 'none' })
          throw e2
        }
      }
      handleUnauthorized()
    }

    if (!silent) {
      uni.showToast({ title: err.message || '请求失败', icon: 'none' })
    }
    throw err
  }
}

export const http = {
  get<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>) {
    return request<T>({ url, method: 'GET', data, ...opts })
  },
  post<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>) {
    return request<T>({ url, method: 'POST', data, ...opts })
  },
  put<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>) {
    return request<T>({ url, method: 'PUT', data, ...opts })
  },
  del<T = any>(url: string, data?: any, opts?: Partial<RequestOptions>) {
    return request<T>({ url, method: 'DELETE', data, ...opts })
  }
}

/**
 * 上传单张图片到服务端，返回可长期访问的 URL。
 * 小程序端 uni.chooseImage 拿到的是临时路径，必须上传后才能持久化。
 */
export function uploadImage(filePath: string): Promise<{ url: string; path: string }> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}/upload/image`,
      filePath,
      name: 'file',
      header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data) as ApiResponse<{ url: string; path: string }>
          if (body.code === 0) {
            resolve(body.data)
          } else {
            uni.showToast({ title: body.message || '上传失败', icon: 'none' })
            reject(new Error(body.message))
          }
        } catch (e) {
          uni.showToast({ title: '上传响应解析失败', icon: 'none' })
          reject(e)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
        reject(err)
      }
    })
  })
}

/** 批量上传，返回全部 URL（失败项自动跳过） */
export async function uploadImages(filePaths: string[]): Promise<string[]> {
  const results = await Promise.all(
    filePaths.map((p) => uploadImage(p).catch(() => null))
  )
  return results.filter((r): r is { url: string; path: string } => !!r).map((r) => r.url)
}

export default http
