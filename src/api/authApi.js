// HuyDeBug Spa - Auth API

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
    if (error.response || !fallbackBase) throw error
    return postJson(path, payload, fallbackBase)
  }
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
