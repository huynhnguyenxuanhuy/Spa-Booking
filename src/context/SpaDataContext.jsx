// HuyDeBug Spa - Spa data store backed by the production API
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { readDatabase, writeDatabase } from '../data/database'

const SpaDataContext = createContext(null)

const makeBookingId = () => 'BK-' + Math.floor(1000 + Math.random() * 9000)

function customerTier(totalSpend) {
  if (totalSpend >= 15000000) return 'Bạch kim'
  if (totalSpend >= 5000000) return 'Vàng'
  return 'Bạc'
}

function syncCustomerFromBooking(customers, booking, services) {
  const service = services.find((s) => s.id === booking.serviceId)
  const spend = service?.price || 0
  const phone = booking.phone?.trim()
  if (!phone) return customers

  const idx = customers.findIndex((c) => c.phone === phone)
  if (idx === -1) {
    return [
      {
        id: 'C-' + String(customers.length + 1).padStart(3, '0'),
        name: booking.customerName,
        phone,
        email: booking.email || '',
        visits: booking.status === 'confirmed' ? 1 : 0,
        totalSpend: booking.status === 'confirmed' ? spend : 0,
        tier: booking.status === 'confirmed' ? customerTier(spend) : 'Mới',
      },
      ...customers,
    ]
  }

  const next = [...customers]
  const current = next[idx]
  const totalSpend = current.totalSpend + (booking.status === 'confirmed' ? spend : 0)
  next[idx] = {
    ...current,
    name: booking.customerName || current.name,
    email: booking.email || current.email || '',
    visits: current.visits + (booking.status === 'confirmed' ? 1 : 0),
    totalSpend,
    tier: customerTier(totalSpend),
  }
  return next
}

export function SpaDataProvider({ children }) {
  const [db, setDb] = useState(() => readDatabase())
  const [usingApi, setUsingApi] = useState(false)

  const persistLocal = useCallback((patch) => {
    const next = writeDatabase(patch)
    setDb(next)
    return next
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/spa-data')
      setDb(res.data)
      setUsingApi(true)
      return res.data
    } catch (error) {
      console.warn('[HuyDeBug] API chưa sẵn sàng, tạm dùng dữ liệu local', error)
      setUsingApi(false)
      return readDatabase()
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh()
    }, 0)
    return () => clearTimeout(timer)
  }, [refresh])

  const addBooking = useCallback(async (booking) => {
    if (usingApi) {
      const res = await api.post('/bookings', booking)
      setDb((current) => ({ ...current, bookings: [res.data.booking, ...current.bookings] }))
      return res.data.id
    }

    const item = { id: makeBookingId(), status: 'pending', createdAt: new Date().toISOString(), ...booking }
    persistLocal({ bookings: [item, ...db.bookings] })
    return item.id
  }, [db.bookings, persistLocal, usingApi])

  const updateBookingStatus = useCallback(async (id, status) => {
    if (usingApi) {
      const res = await api.patch(`/bookings/${encodeURIComponent(id)}/status`, { status })
      setDb(res.data)
      return
    }

    const existing = db.bookings.find((b) => b.id === id)
    const bookings = db.bookings.map((b) => (b.id === id ? { ...b, status } : b))
    const customers =
      existing && existing.status !== 'confirmed' && status === 'confirmed'
        ? syncCustomerFromBooking(db.customers, { ...existing, status }, db.services)
        : db.customers
    persistLocal({ bookings, customers })
  }, [db.bookings, db.customers, db.services, persistLocal, usingApi])

  const removeBooking = useCallback(async (id) => {
    if (usingApi) {
      const res = await api.delete(`/bookings/${encodeURIComponent(id)}`)
      setDb(res.data)
      return
    }

    persistLocal({ bookings: db.bookings.filter((b) => b.id !== id) })
  }, [db.bookings, persistLocal, usingApi])

  const upsertService = useCallback(async (svc) => {
    if (usingApi) {
      const res = await api.post('/services', svc)
      setDb(res.data)
      return
    }

    const id = svc.id || 'svc-' + Date.now()
    const idx = db.services.findIndex((s) => s.id === id)
    const item = { ...svc, id }
    const services = idx === -1
      ? [item, ...db.services]
      : db.services.map((s) => (s.id === id ? { ...s, ...item } : s))
    persistLocal({ services })
  }, [db.services, persistLocal, usingApi])

  const removeService = useCallback(async (id) => {
    if (usingApi) {
      const res = await api.delete(`/services/${encodeURIComponent(id)}`)
      setDb(res.data)
      return
    }

    persistLocal({ services: db.services.filter((s) => s.id !== id) })
  }, [db.services, persistLocal, usingApi])

  const value = {
    users: db.users,
    services: db.services,
    bookings: db.bookings,
    customers: db.customers,
    usingApi,
    refresh,
    addBooking,
    updateBookingStatus,
    removeBooking,
    upsertService,
    removeService,
  }
  return <SpaDataContext.Provider value={value}>{children}</SpaDataContext.Provider>
}

export function useSpaData() {
  const ctx = useContext(SpaDataContext)
  if (!ctx) throw new Error('useSpaData must be used within <SpaDataProvider>')
  return ctx
}
