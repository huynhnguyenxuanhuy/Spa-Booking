// HuyDeBug Spa - Local database layer
// Versioned localStorage store used by the SPA when no backend is connected.
import { customers as defaultCustomers, initialBookings, services as defaultServices } from './mockData'

const DB_KEY = 'hdb_spa_database_v1'
const DB_VERSION = 1
const LEGACY_SERVICES_KEY = 'hdb_services'
const LEGACY_BOOKINGS_KEY = 'hdb_bookings'
const OTP_KEY = 'hdb_spa_otps_v1'
const OTP_TTL_MS = 5 * 60 * 1000

const seedUsers = [
  {
    id: 'admin-001',
    name: 'Xuan Huy',
    email: 'xuanhuy132005@gmail.com',
    passwordHash: '750252f70be88722bbace8586fd5640aa511f25084cf80f4fec91aaa7de3c27e',
    role: 'admin',
    avatar: 'XH',
    status: 'active',
    createdAt: '2026-04-28T00:00:00.000Z',
    lastLoginAt: null,
  },
]

const clone = (value) => JSON.parse(JSON.stringify(value))

const safeUser = (user) => {
  if (!user) return null
  const { password: _password, passwordHash: _passwordHash, ...rest } = user
  return rest
}

const normalizeEmail = (email) => email?.trim().toLowerCase() || ''
const normalizePhone = (phone) => phone?.replace(/\s+/g, '').trim() || ''

const makeSeed = () => ({
  version: DB_VERSION,
  users: clone(seedUsers),
  services: clone(defaultServices),
  bookings: clone(initialBookings),
  customers: clone(defaultCustomers),
  updatedAt: new Date().toISOString(),
})

function normalize(db) {
  const next = { ...makeSeed(), ...(db || {}) }
  next.version = DB_VERSION
  next.users = Array.isArray(next.users) ? next.users : clone(seedUsers)
  next.services = Array.isArray(next.services) ? next.services : clone(defaultServices)
  next.bookings = Array.isArray(next.bookings) ? next.bookings : clone(initialBookings)
  next.customers = Array.isArray(next.customers) ? next.customers : clone(defaultCustomers)

  for (const user of seedUsers) {
    const existing = next.users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase())
    if (existing) {
      Object.assign(existing, {
        ...user,
        ...existing,
        passwordHash: user.passwordHash,
        role: 'admin',
        status: existing.status || 'active',
      })
      delete existing.password
    } else {
      next.users.unshift({ ...user })
    }
  }

  return next
}

function readLegacy(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function readDatabase() {
  if (typeof window === 'undefined') return makeSeed()
  try {
    const raw = localStorage.getItem(DB_KEY)
    const legacyServices = readLegacy(LEGACY_SERVICES_KEY)
    const legacyBookings = readLegacy(LEGACY_BOOKINGS_KEY)
    const seed = raw ? JSON.parse(raw) : { services: legacyServices, bookings: legacyBookings }
    const db = normalize(seed)
    localStorage.setItem(DB_KEY, JSON.stringify({ ...db, updatedAt: new Date().toISOString() }))
    return db
  } catch (e) {
    console.warn('[HuyDeBug] database reset because stored data is invalid', e)
    const db = makeSeed()
    localStorage.setItem(DB_KEY, JSON.stringify(db))
    return db
  }
}

export function writeDatabase(patch) {
  const current = readDatabase()
  const next = normalize({ ...current, ...patch, updatedAt: new Date().toISOString() })
  localStorage.setItem(DB_KEY, JSON.stringify(next))
  return next
}

function readOtpStore() {
  try {
    const raw = localStorage.getItem(OTP_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeOtpStore(challenges) {
  localStorage.setItem(OTP_KEY, JSON.stringify(challenges))
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function createOtpChallenge({ contact, purpose = 'register' }) {
  const normalizedContact = normalizeEmail(contact) || normalizePhone(contact)
  const now = Date.now()
  const challenge = {
    id: 'otp-' + now + '-' + Math.random().toString(36).slice(2, 8),
    contact: normalizedContact,
    purpose,
    code: generateOtp(),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
  }
  const active = readOtpStore().filter((item) => item.expiresAt > now && item.contact !== normalizedContact)
  writeOtpStore([challenge, ...active])
  return challenge
}

export function verifyOtpChallenge({ challengeId, contact, code, purpose = 'register' }) {
  const now = Date.now()
  const normalizedContact = normalizeEmail(contact) || normalizePhone(contact)
  const challenges = readOtpStore().filter((item) => item.expiresAt > now)
  const challenge = challenges.find(
    (item) =>
      item.id === challengeId &&
      item.contact === normalizedContact &&
      item.purpose === purpose,
  )

  if (!challenge || challenge.attempts >= 5) {
    writeOtpStore(challenges)
    return false
  }

  if (challenge.code !== String(code).trim()) {
    writeOtpStore(challenges.map((item) => (
      item.id === challenge.id ? { ...item, attempts: item.attempts + 1 } : item
    )))
    return false
  }

  writeOtpStore(challenges.filter((item) => item.id !== challenge.id))
  return true
}

export function findUserByContact(contact) {
  const db = readDatabase()
  const email = normalizeEmail(contact)
  const phone = normalizePhone(contact)
  const user = db.users.find((u) => normalizeEmail(u.email) === email || normalizePhone(u.phone) === phone)
  return safeUser(user)
}

export function createCustomerUser({ name, email, phone, password }) {
  const db = readDatabase()
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(phone)
  const exists = db.users.some(
    (u) => normalizeEmail(u.email) === normalizedEmail || normalizePhone(u.phone) === normalizedPhone,
  )

  if (exists) {
    const err = new Error('Tài khoản đã tồn tại. Vui lòng đăng nhập hoặc dùng thông tin khác.')
    err.code = 'USER_EXISTS'
    throw err
  }

  const user = {
    id: 'cus-' + Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: 'customer',
    avatar: name.trim().slice(0, 2).toUpperCase(),
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  }

  writeDatabase({ users: [user, ...db.users] })
  return safeUser(user)
}

async function sha256(value) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function findUserByCredentials({ email, password }) {
  const db = readDatabase()
  const passwordHash = await sha256(password || '')
  const user = db.users.find(
    (u) => normalizeEmail(u.email) === normalizeEmail(email) && u.passwordHash === passwordHash,
  )
  if (!user || user.status === 'disabled') return null

  const updatedUsers = db.users.map((u) =>
    u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u,
  )
  writeDatabase({ users: updatedUsers })

  return safeUser({ ...user, lastLoginAt: new Date().toISOString() })
}

export function getDatabaseMeta() {
  return { key: DB_KEY, version: DB_VERSION }
}
