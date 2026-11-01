// 请求封装：基于 uni.request，统一 Base URL、token、错误处理
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  loading?: boolean
}

function getToken(): string {
  return uni.getStorageSync('token') || ''
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {} } = options
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
        ...header
      },
      success: (res: any) => {
        const body = res.data as ApiResponse<T>
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data)
        } else {
          const msg = body?.message || `请求失败(${res.statusCode})`
          if (res.statusCode === 401) {
            uni.removeStorageSync('token')
            uni.reLaunch({ url: '/pages/index/index' })
          }
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络异常，请检查网络', icon: 'none' })
        reject(err)
      }
    })
  })
}

export const http = {
  get<T = any>(url: string, data?: any) {
    return request<T>({ url, method: 'GET', data })
  },
  post<T = any>(url: string, data?: any) {
    return request<T>({ url, method: 'POST', data })
  },
  put<T = any>(url: string, data?: any) {
    return request<T>({ url, method: 'PUT', data })
  },
  del<T = any>(url: string, data?: any) {
    return request<T>({ url, method: 'DELETE', data })
  }
}

export default http
