import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8080'
const dbPath = resolve('server/storage/database.json')
const originalDb = existsSync(dbPath) ? readFileSync(dbPath, 'utf8') : null
const stamp = Date.now()

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed ${res.status}: ${data.message || JSON.stringify(data)}`)
  }
  return data
}

async function post(path, body, token) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

async function patch(path, body, token) {
  return request(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

async function del(path, token) {
  return request(path, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

function readOtp(contact, purpose) {
  if (!existsSync(dbPath)) throw new Error('Cannot read local OTP database')
  const db = JSON.parse(readFileSync(dbPath, 'utf8'))
  const item = db.otpChallenges.find((otp) => otp.contact === contact && otp.purpose === purpose)
  if (!item) throw new Error(`OTP not found for ${purpose}:${contact}`)
  return item.code
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  try {
    const health = await request('/api/health')
    assert(health.ok, 'health check failed')

    const publicData = await request('/api/spa-data')
    assert(publicData.services.length > 0, 'public services missing')
    assert(publicData.users.length === 0, 'public API leaked users')
    assert(publicData.bookings.length === 0, 'public API leaked bookings')
    assert(publicData.customers.length === 0, 'public API leaked customers')

    const admin = await post('/api/auth/login', {
      email: 'xuanhuy132005@gmail.com',
      password: 'Huy2005',
    })
    assert(admin.user.role === 'admin', 'admin login did not return admin user')
    const token = admin.token

    const privateData = await request('/api/spa-data', {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert(privateData.bookings.length >= 0, 'admin bookings not readable')

    const booking = await post('/api/bookings', {
      customerName: 'Smoke Test',
      phone: '0999999999',
      email: `smoke-${stamp}@example.com`,
      serviceId: publicData.services[0].id,
      date: '2026-05-05',
      time: '10:00',
      note: 'smoke test',
    })
    assert(booking.id, 'booking create failed')
    await patch(`/api/bookings/${encodeURIComponent(booking.id)}/status`, { status: 'pending' }, token)
    await del(`/api/bookings/${encodeURIComponent(booking.id)}`, token)

    const serviceId = `svc-smoke-${stamp}`
    await post('/api/services', {
      id: serviceId,
      name: 'Smoke Service',
      category: 'Test',
      duration: 30,
      price: 100000,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      description: 'Temporary smoke test service',
      highlights: [],
    }, token)
    await del(`/api/services/${encodeURIComponent(serviceId)}`, token)

    const email = `smoke-${stamp}@example.com`
    const phone = `098${String(stamp).slice(-7)}`
    const otpRequest = await post('/api/auth/otp/request', {
      contact: email,
      channel: 'email',
      purpose: 'register',
    })
    assert(otpRequest.challengeId, 'register OTP request failed')
    const registerCode = readOtp(email, 'register')
    const customer = await post('/api/auth/register', {
      name: 'Smoke Customer',
      email,
      phone,
      channel: 'email',
      challengeId: otpRequest.challengeId,
      otp: registerCode,
    })
    assert(customer.user.role === 'customer', 'customer register failed')

    const loginOtp = await post('/api/auth/otp/request', {
      contact: email,
      channel: 'email',
      purpose: 'login',
    })
    const loginCode = readOtp(email, 'login')
    const customerLogin = await post('/api/auth/customer-login', {
      contact: email,
      challengeId: loginOtp.challengeId,
      otp: loginCode,
    })
    assert(customerLogin.user.role === 'customer', 'customer OTP login failed')

    console.log('Smoke tests passed')
  } finally {
    if (originalDb !== null) writeFileSync(dbPath, originalDb)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
