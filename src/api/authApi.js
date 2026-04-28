// HuyDeBug Spa - Auth API
import {
  createCustomerUser,
  findUserByContact,
  findUserByCredentials,
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
    return {
      data: {
        challengeId: 'otp-disabled',
        channel: payload.channel || 'email',
        expiresAt: Date.now(),
        message: 'OTP đang tạm tắt để khách có thể đăng ký nhanh.',
      },
    }
  }

  if (path === '/auth/register') {
    const user = createCustomerUser(payload)
    return {
      data: {
        token: 'hdb.local.jwt.' + btoa(`${user.email || user.phone}:${Date.now()}`),
        user,
      },
    }
  }

  if (path === '/auth/customer-login') {
    const user = findUserByContact(payload.contact)
    if (!user || user.role !== 'customer') {
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
  return postJsonWithFallback('/auth/register', { name, email, phone, channel, challengeId, otp, otpDisabled: true })
}

export function customerOtpLoginRequest({ contact, challengeId, otp }) {
  return postJsonWithFallback('/auth/customer-login', { contact, challengeId, otp, otpDisabled: true })
}

export async function logoutRequest() {
  return { data: { ok: true } }
}
