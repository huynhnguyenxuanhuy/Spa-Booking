// HuyDeBug Spa - Auth Context
// Author: HuyDeBug
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  customerOtpLoginRequest,
  loginRequest,
  logoutRequest,
  registerCustomerRequest,
  requestCustomerOtp,
} from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Khôi phục session từ localStorage khi load
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hdb_user')
      const token = localStorage.getItem('hdb_token')
      if (raw && token) setUser(JSON.parse(raw))
    } catch (e) {
      console.warn('[HuyDeBug] khôi phục session thất bại', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const res = await loginRequest({ email, password })
    const { token, user: u } = res.data
    localStorage.setItem('hdb_token', token)
    localStorage.setItem('hdb_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const requestOtp = useCallback(async ({ contact, channel, purpose }) => {
    const res = await requestCustomerOtp({ contact, channel, purpose })
    return res.data
  }, [])

  const registerCustomer = useCallback(async (payload) => {
    const res = await registerCustomerRequest(payload)
    const { token, user: u } = res.data
    localStorage.setItem('hdb_token', token)
    localStorage.setItem('hdb_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const loginCustomerWithOtp = useCallback(async (payload) => {
    const res = await customerOtpLoginRequest(payload)
    const { token, user: u } = res.data
    localStorage.setItem('hdb_token', token)
    localStorage.setItem('hdb_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      localStorage.removeItem('hdb_token')
      localStorage.removeItem('hdb_user')
      setUser(null)
    }
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    requestOtp,
    registerCustomer,
    loginCustomerWithOtp,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
