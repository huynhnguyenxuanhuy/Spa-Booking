// HuyDeBug Spa - Axios instance with interceptors
// Author: HuyDeBug
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const fallbackBaseURL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8080/api'
    : null

// Request interceptor: gắn token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hdb_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: xử lý lỗi chung
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response && fallbackBaseURL && !error.config?._fallbackTried) {
      error.config._fallbackTried = true
      error.config.baseURL = fallbackBaseURL
      await new Promise((resolve) => setTimeout(resolve, 450))
      return api(error.config)
    }

    if (!error.response && !error.config?._retried) {
      error.config._retried = true
      await new Promise((resolve) => setTimeout(resolve, 650))
      return api(error.config)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('hdb_token')
      localStorage.removeItem('hdb_user')
      // Không redirect cứng để tránh phá flow react-router
    }
    if (!error.response) {
      error.message = 'Không kết nối được máy chủ. Vui lòng kiểm tra server rồi thử lại.'
    }
    return Promise.reject(error)
  },
)

export default api
