// HuyDeBug Spa - Auth API
import {
  createCustomerUser,
  createOtpChallenge,
  findUserByContact,
  findUserByCredentials,
  verifyOtpChallenge,
} from '../data/database'

const primaryBase = '/api'
const fallbackBase =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8080/api'
    : null

async function postJson(path, payload, base = primaryBase) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Yêu cầu không thành công')
    err.response = { status: res.status, data }
    throw err
  }
  return { data }
}

async function postJsonWithFallback(path, payload) {
  try {
    return await postJson(path, payload)
  } catch (error) {
    if (!error.response && fallbackBase) {
      try {
        return await postJson(path, payload, fallbackBase)
      } catch (fallbackError) {
        return localFallback(path, payload, fallbackError)
      }
    }
    return localFallback(path, payload, error)
  }
}

function deliveryLabel(channel) {
  return channel === 'phone' ? 'số điện thoại' : 'email'
}

function shouldUseLocal(error) {
  return !error.response || [404, 405].includes(error.response.status)
}

async function localFallback(path, payload, originalError) {
  if (!shouldUseLocal(originalError)) throw originalError

  if (path === '/auth/login') {
    const user = await findUserByCredentials(payload)
    if (!user) {
      const err = new Error('Email hoặc mật khẩu không đúng')
      err.response = { status: 401, data: { message: err.message } }
      throw err
    }
    return {
      data: {
        token: 'hdb.local.jwt.' + btoa(`${user.email}:${Date.now()}`),
        user,
      },
    }
  }

  if (path === '/auth/otp/request') {
    const user = findUserByContact(payload.contact)
    if (payload.purpose === 'login' && (!user || user.role !== 'customer')) {
      const err = new Error('Không tìm thấy tài khoản khách hàng. Vui lòng đăng ký trước.')
      err.response = { status: 404, data: { message: err.message } }
      throw err
    }
    if (payload.purpose === 'register' && user) {
      const err = new Error('Thông tin này đã có tài khoản. Vui lòng đăng nhập.')
      err.response = { status: 409, data: { message: err.message } }
      throw err
    }

    const challenge = createOtpChallenge({ contact: payload.contact, purpose: payload.purpose })
    console.info(`[HuyDeBug Spa] OTP ${payload.purpose} gửi tới ${deliveryLabel(payload.channel)} ${payload.contact}: ${challenge.code}`)
    return {
      data: {
        challengeId: challenge.id,
        channel: payload.channel || 'email',
        expiresAt: challenge.expiresAt,
        message: `Mã OTP đã được gửi tới ${deliveryLabel(payload.channel)} của bạn.`,
      },
    }
  }

  if (path === '/auth/register') {
    const contact = payload.channel === 'phone' ? payload.phone : payload.email
    const ok = verifyOtpChallenge({
      challengeId: payload.challengeId,
      contact,
      code: payload.otp,
      purpose: 'register',
    })
    if (!ok) {
      const err = new Error('Mã OTP không đúng hoặc đã hết hạn')
      err.response = { status: 422, data: { message: err.message } }
      throw err
    }
    const user = createCustomerUser(payload)
    return {
      data: {
        token: 'hdb.local.jwt.' + btoa(`${user.email || user.phone}:${Date.now()}`),
        user,
      },
    }
  }

  if (path === '/auth/customer-login') {
    const ok = verifyOtpChallenge({
      challengeId: payload.challengeId,
      contact: payload.contact,
      code: payload.otp,
      purpose: 'login',
    })
    const user = findUserByContact(payload.contact)
    if (!ok || !user || user.role !== 'customer') {
      const err = new Error('OTP không hợp lệ hoặc tài khoản chưa tồn tại')
      err.response = { status: 401, data: { message: err.message } }
      throw err
    }
    return {
      data: {
        token: 'hdb.local.jwt.' + btoa(`${user.email || user.phone}:${Date.now()}`),
        user,
      },
    }
  }

  throw originalError
}

export function loginRequest({ email, password }) {
  return postJsonWithFallback('/auth/login', { email, password })
}

export function requestCustomerOtp({ contact, channel = 'email', purpose = 'login' }) {
  return postJsonWithFallback('/auth/otp/request', { contact, channel, purpose })
}

export function registerCustomerRequest({ name, email, phone, channel, challengeId, otp }) {
  return postJsonWithFallback('/auth/register', { name, email, phone, channel, challengeId, otp })
}

export function customerOtpLoginRequest({ contact, challengeId, otp }) {
  return postJsonWithFallback('/auth/customer-login', { contact, challengeId, otp })
}

export async function logoutRequest() {
  return { data: { ok: true } }
}
