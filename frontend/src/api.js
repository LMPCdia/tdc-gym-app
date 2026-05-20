import axios from 'axios'

// Usa la misma IP/host desde donde se sirve el frontend, puerto 8000
// Así funciona en localhost, en red local y sin importar si cambia la IP
const API_URL = import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('tdc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginEndpoint = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('tdc_token')
      localStorage.removeItem('tdc_user')
      window.location.href = '/tdc-gym/'
    }
    return Promise.reject(err)
  }
)

export default api
