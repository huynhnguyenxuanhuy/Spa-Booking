/* global Buffer, process */
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createHmac, randomBytes, randomInt, timingSafeEqual, webcrypto } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { customers as defaultCustomers, initialBookings, services as defaultServices } from '../src/data/mockData.js'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const rootDir = resolve(__dirname, '..')
const storageDir = resolve(__dirname, 'storage')
const dbPath = resolve(storageDir, 'database.json')
const distDir = resolve(rootDir, 'dist')

const PORT = Number(process.env.PORT || 8080)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'change-this-secret-before-production'
const ADMIN_EMAIL = 'xuanhuy132005@gmail.com'
const ADMIN_PASSWORD_HASH = '750252f70be88722bbace8586fd5640aa511f25084cf80f4fec91aaa7de3c27e'
const OTP_TTL_MS = 5 * 60 * 1000

const clone = (value) => JSON.parse(JSON.stringify(value))
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const normalizePhone = (phone) => String(phone || '').replace(/\s+/g, '').trim()
const nowIso = () => new Date().toISOString()

function seedDatabase() {
  return {
    version: 1,
    users: [
      {
        id: 'admin-001',
        name: 'Xuan Huy',
        email: ADMIN_EMAIL,
        passwordHash: ADMIN_PASSWORD_HASH,
        role: 'admin',
        avatar: 'XH',
        status: 'active',
        createdAt: '2026-04-28T00:00:00.000Z',
        lastLoginAt: null,
      },
    ],
    services: clone(defaultServices),
    bookings: clone(initialBookings),
    customers: clone(defaultCustomers),
    otpChallenges: [],
    updatedAt: nowIso(),
  }
}

function ensureStorage() {
  if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true })
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(seedDatabase(), null, 2))
}

function safeUser(user) {
  if (!user) return null
  const { passwordHash: _passwordHash, password: _password, ...rest } = user
  return rest
}

function normalizeDb(db) {
  const next = { ...seedDatabase(), ...(db || {}) }
  next.users = Array.isArray(next.users) ? next.users : []
  next.services = Array.isArray(next.services) ? next.services : clone(defaultServices)
  next.bookings = Array.isArray(next.bookings) ? next.bookings : clone(initialBookings)
  next.customers = Array.isArray(next.customers) ? next.customers : clone(defaultCustomers)
  next.otpChallenges = Array.isArray(next.otpChallenges) ? next.otpChallenges : []

  const admin = next.users.find((user) => normalizeEmail(user.email) === ADMIN_EMAIL)
  if (admin) {
    Object.assign(admin, {
      ...admin,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'admin',
      status: admin.status || 'active',
    })
    delete admin.password
  } else {
    next.users.unshift(seedDatabase().users[0])
  }
  return next
}

function readDb() {
  ensureStorage()
  try {
    return normalizeDb(JSON.parse(readFileSync(dbPath, 'utf8')))
  } catch {
    const db = seedDatabase()
    writeDb(db)
    return db
  }
}

function writeDb(db) {
  ensureStorage()
  const next = normalizeDb({ ...db, updatedAt: nowIso() })
  writeFileSync(dbPath, JSON.stringify(next, null, 2))
  return next
}

async function sha256(value) {
  const data = new TextEncoder().encode(value)
  const hash = await webcrypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function base64url(value) {
  return Buffer.from(value).toString('base64url')
}

function signToken(payload) {
  const body = base64url(JSON.stringify({ ...payload, iat: Date.now() }))
  const sig = createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function getAuth(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  return verifyToken(token)
}

function requireAdmin(req) {
  const auth = getAuth(req)
  if (!auth || auth.role !== 'admin') {
    const err = new Error('Bạn không có quyền thực hiện thao tác này')
    err.status = 403
    throw err
  }
  return auth
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) {
        reject(Object.assign(new Error('Payload quá lớn'), { status: 413 }))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {})
      } catch {
        reject(Object.assign(new Error('JSON không hợp lệ'), { status: 400 }))
      }
    })
  })
}

function findUserByContact(db, contact) {
  const email = normalizeEmail(contact)
  const phone = normalizePhone(contact)
  return db.users.find((user) => normalizeEmail(user.email) === email || normalizePhone(user.phone) === phone)
}

function findService(db, id) {
  return db.services.find((service) => service.id === id)
}

function customerTier(totalSpend) {
  if (totalSpend >= 15000000) return 'Bạch kim'
  if (totalSpend >= 5000000) return 'Vàng'
  return 'Bạc'
}

function syncCustomerFromBooking(db, booking) {
  const phone = normalizePhone(booking.phone)
  if (!phone) return db.customers
  const service = findService(db, booking.serviceId)
  const spend = service?.price || 0
  const index = db.customers.findIndex((customer) => normalizePhone(customer.phone) === phone)

  if (index === -1) {
    return [
      {
        id: 'C-' + String(db.customers.length + 1).padStart(3, '0'),
        name: booking.customerName,
        phone,
        email: booking.email || '',
        visits: 1,
        totalSpend: spend,
        tier: customerTier(spend),
      },
      ...db.customers,
    ]
  }

  return db.customers.map((customer, i) => {
    if (i !== index) return customer
    const totalSpend = customer.totalSpend + spend
    return {
      ...customer,
      name: booking.customerName || customer.name,
      email: booking.email || customer.email || '',
      visits: customer.visits + 1,
      totalSpend,
      tier: customerTier(totalSpend),
    }
  })
}

function createOtp(db, { contact, purpose }) {
  const normalizedContact = normalizeEmail(contact) || normalizePhone(contact)
  const issuedAt = Date.now()
  const challenge = {
    id: `otp-${issuedAt}-${randomBytes(4).toString('hex')}`,
    contact: normalizedContact,
    purpose,
    code: String(randomInt(100000, 999999)),
    expiresAt: issuedAt + OTP_TTL_MS,
    attempts: 0,
  }
  db.otpChallenges = [
    challenge,
    ...db.otpChallenges.filter((item) => item.expiresAt > issuedAt && item.contact !== normalizedContact),
  ]
  return challenge
}

function verifyOtp(db, { challengeId, contact, code, purpose }) {
  const normalizedContact = normalizeEmail(contact) || normalizePhone(contact)
  const active = db.otpChallenges.filter((item) => item.expiresAt > Date.now())
  const challenge = active.find(
    (item) => item.id === challengeId && item.contact === normalizedContact && item.purpose === purpose,
  )
  db.otpChallenges = active
  if (!challenge || challenge.attempts >= 5) return false
  if (challenge.code !== String(code || '').trim()) {
    db.otpChallenges = active.map((item) => (
      item.id === challenge.id ? { ...item, attempts: item.attempts + 1 } : item
    ))
    return false
  }
  db.otpChallenges = active.filter((item) => item.id !== challenge.id)
  return true
}

function notifyOtp({ channel, contact, code, purpose }) {
  // Production hook: connect SMTP, SendGrid, Twilio, or Zalo OA here.
  // Do not show this code to customers in UI; server log is for owner testing.
  console.info(`[OTP] ${purpose} ${channel} ${contact}: ${code}`)
}

function publicData(db, auth = null) {
  if (auth?.role !== 'admin') {
    return {
      users: [],
      services: db.services,
      bookings: [],
      customers: [],
    }
  }

  return {
    users: db.users.map(safeUser),
    services: db.services,
    bookings: db.bookings,
    customers: db.customers,
  }
}

async function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true })
  }

  if (req.method === 'GET' && url.pathname === '/api/spa-data') {
    return sendJson(res, 200, publicData(readDb(), getAuth(req)))
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const body = await readBody(req)
    const db = readDb()
    const passwordHash = await sha256(body.password || '')
    const user = db.users.find(
      (item) => normalizeEmail(item.email) === normalizeEmail(body.email) && item.passwordHash === passwordHash,
    )
    if (!user || user.status === 'disabled') return sendJson(res, 401, { message: 'Email hoặc mật khẩu không đúng' })
    const nextUsers = db.users.map((item) => item.id === user.id ? { ...item, lastLoginAt: nowIso() } : item)
    const nextDb = writeDb({ ...db, users: nextUsers })
    const fresh = nextDb.users.find((item) => item.id === user.id)
    return sendJson(res, 200, { token: signToken({ id: user.id, role: user.role }), user: safeUser(fresh) })
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/otp/request') {
    const body = await readBody(req)
    const db = readDb()
    const user = findUserByContact(db, body.contact)
    const purpose = body.purpose || 'login'
    if (purpose === 'login' && (!user || user.role !== 'customer')) {
      return sendJson(res, 404, { message: 'Không tìm thấy tài khoản khách hàng. Vui lòng đăng ký trước.' })
    }
    if (purpose === 'register' && user) {
      return sendJson(res, 409, { message: 'Thông tin này đã có tài khoản. Vui lòng đăng nhập.' })
    }
    const challenge = createOtp(db, { contact: body.contact, purpose })
    writeDb(db)
    notifyOtp({ channel: body.channel || 'email', contact: body.contact, code: challenge.code, purpose })
    return sendJson(res, 200, {
      challengeId: challenge.id,
      channel: body.channel || 'email',
      expiresAt: challenge.expiresAt,
      message: `Mã OTP đã được gửi tới ${body.channel === 'phone' ? 'số điện thoại' : 'email'} của bạn.`,
    })
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    const body = await readBody(req)
    const db = readDb()
    const contact = body.channel === 'phone' ? body.phone : body.email
    if (!verifyOtp(db, { challengeId: body.challengeId, contact, code: body.otp, purpose: 'register' })) {
      writeDb(db)
      return sendJson(res, 422, { message: 'Mã OTP không đúng hoặc đã hết hạn' })
    }
    const email = normalizeEmail(body.email)
    const phone = normalizePhone(body.phone)
    if (db.users.some((user) => normalizeEmail(user.email) === email || normalizePhone(user.phone) === phone)) {
      writeDb(db)
      return sendJson(res, 409, { message: 'Tài khoản đã tồn tại. Vui lòng đăng nhập.' })
    }
    const user = {
      id: 'cus-' + Date.now(),
      name: String(body.name || '').trim(),
      email,
      phone,
      role: 'customer',
      avatar: String(body.name || 'KH').trim().slice(0, 2).toUpperCase(),
      status: 'active',
      createdAt: nowIso(),
      lastLoginAt: nowIso(),
    }
    const nextDb = writeDb({ ...db, users: [user, ...db.users] })
    const fresh = nextDb.users.find((item) => item.id === user.id)
    return sendJson(res, 200, { token: signToken({ id: user.id, role: user.role }), user: safeUser(fresh) })
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/customer-login') {
    const body = await readBody(req)
    const db = readDb()
    const user = findUserByContact(db, body.contact)
    const valid = verifyOtp(db, { challengeId: body.challengeId, contact: body.contact, code: body.otp, purpose: 'login' })
    if (!valid || !user || user.role !== 'customer' || user.status === 'disabled') {
      writeDb(db)
      return sendJson(res, 401, { message: 'OTP không hợp lệ hoặc tài khoản chưa tồn tại' })
    }
    const nextUsers = db.users.map((item) => item.id === user.id ? { ...item, lastLoginAt: nowIso() } : item)
    const nextDb = writeDb({ ...db, users: nextUsers })
    const fresh = nextDb.users.find((item) => item.id === user.id)
    return sendJson(res, 200, { token: signToken({ id: user.id, role: user.role }), user: safeUser(fresh) })
  }

  if (req.method === 'POST' && url.pathname === '/api/bookings') {
    const body = await readBody(req)
    const db = readDb()
    const booking = {
      id: 'BK-' + randomInt(1000, 9999),
      status: 'pending',
      createdAt: nowIso(),
      customerName: String(body.customerName || '').trim(),
      phone: String(body.phone || '').trim(),
      email: normalizeEmail(body.email),
      serviceId: body.serviceId,
      date: body.date,
      time: body.time,
      note: body.note || '',
    }
    writeDb({ ...db, bookings: [booking, ...db.bookings] })
    return sendJson(res, 200, { id: booking.id, booking })
  }

  const bookingStatus = url.pathname.match(/^\/api\/bookings\/([^/]+)\/status$/)
  if (req.method === 'PATCH' && bookingStatus) {
    requireAdmin(req)
    const body = await readBody(req)
    const db = readDb()
    const id = decodeURIComponent(bookingStatus[1])
    const existing = db.bookings.find((booking) => booking.id === id)
    const bookings = db.bookings.map((booking) => booking.id === id ? { ...booking, status: body.status } : booking)
    const customers = existing && existing.status !== 'confirmed' && body.status === 'confirmed'
      ? syncCustomerFromBooking(db, { ...existing, status: body.status })
      : db.customers
    const nextDb = writeDb({ ...db, bookings, customers })
    return sendJson(res, 200, publicData(nextDb, { role: 'admin' }))
  }

  const bookingDelete = url.pathname.match(/^\/api\/bookings\/([^/]+)$/)
  if (req.method === 'DELETE' && bookingDelete) {
    requireAdmin(req)
    const db = readDb()
    const id = decodeURIComponent(bookingDelete[1])
    const nextDb = writeDb({ ...db, bookings: db.bookings.filter((booking) => booking.id !== id) })
    return sendJson(res, 200, publicData(nextDb, { role: 'admin' }))
  }

  if (req.method === 'POST' && url.pathname === '/api/services') {
    requireAdmin(req)
    const body = await readBody(req)
    const db = readDb()
    const id = body.id || 'svc-' + Date.now()
    const service = { ...body, id, price: Number(body.price), duration: Number(body.duration) }
    const exists = db.services.some((item) => item.id === id)
    const services = exists
      ? db.services.map((item) => item.id === id ? { ...item, ...service } : item)
      : [service, ...db.services]
    const nextDb = writeDb({ ...db, services })
    return sendJson(res, 200, publicData(nextDb, { role: 'admin' }))
  }

  const serviceDelete = url.pathname.match(/^\/api\/services\/([^/]+)$/)
  if (req.method === 'DELETE' && serviceDelete) {
    requireAdmin(req)
    const db = readDb()
    const id = decodeURIComponent(serviceDelete[1])
    const nextDb = writeDb({ ...db, services: db.services.filter((service) => service.id !== id) })
    return sendJson(res, 200, publicData(nextDb, { role: 'admin' }))
  }

  return sendJson(res, 404, { message: 'Không tìm thấy API' })
}

function serveStatic(req, res, url) {
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname
  const target = resolve(distDir, '.' + pathname)
  const filePath = target.startsWith(distDir) && existsSync(target) ? target : join(distDir, 'index.html')
  if (!existsSync(filePath)) return sendJson(res, 404, { message: 'Frontend chưa được build. Chạy npm run build trước.' })

  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  }
  res.writeHead(200, {
    'Content-Type': types[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': extname(filePath) === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
  })
  res.end(readFileSync(filePath))
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url)
    return serveStatic(req, res, url)
  } catch (error) {
    const status = error.status || 500
    console.error(error)
    return sendJson(res, status, { message: error.message || 'Lỗi máy chủ' })
  }
}).listen(PORT, () => {
  ensureStorage()
  console.info(`HuyDeBug Spa server running at http://localhost:${PORT}`)
})
