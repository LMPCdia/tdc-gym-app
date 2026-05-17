import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tdc_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      localStorage.setItem('tdc_token', data.access_token)
      localStorage.setItem('tdc_user', JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.response?.data?.detail || 'Error al iniciar sesión' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('tdc_token')
    localStorage.removeItem('tdc_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
