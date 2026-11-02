import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (res) => {
    const body = res.data
    // 后端统一包络：{ code, message, data }
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data
      const msg = body.message || '请求失败'
      ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }
    return body
  },
  (err) => {
    const status = err.response?.status
    const msg = err.response?.data?.message || err.message || '网络异常'

    if (status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      // 已在登录页时不重复跳转，避免循环
      if (!location.pathname.startsWith('/login')) {
        ElMessage.warning('登录已过期，请重新登录')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(msg))
    }

    if (status === 403) {
      ElMessage.error(msg || '当前角色无权执行该操作')
    } else if (err.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(new Error(msg))
  }
)

export default request
