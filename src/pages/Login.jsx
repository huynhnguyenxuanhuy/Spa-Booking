// HuyDeBug Spa - Login and customer registration page
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const readableError = (err, fallback) =>
  err.response?.data?.message ||
  (err.message === 'Network Error' ? 'Không kết nối được máy chủ. Vui lòng kiểm tra server rồi thử lại.' : err.message) ||
  fallback

export default function Login() {
  const { login, loginCustomerWithOtp, registerCustomer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/admin'

  const [tab, setTab] = useState('customer')
  const [customerMode, setCustomerMode] = useState('login')
  const [adminForm, setAdminForm] = useState({ email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ contact: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')

  const clearFeedback = () => {
    setError('')
    setNotice('')
  }

  const submitCustomerLogin = async (e) => {
    e.preventDefault()
    clearFeedback()
    if (!loginForm.contact.trim()) {
      setError('Vui lòng nhập email hoặc số điện thoại.')
      return
    }
    setLoadingText('Đang đăng nhập...')
    setLoading(true)
    try {
      await loginCustomerWithOtp({
        contact: loginForm.contact,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(readableError(err, 'Đăng nhập thất bại'))
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  const submitCustomerRegister = async (e) => {
    e.preventDefault()
    clearFeedback()
    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.phone.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên, email và số điện thoại.')
      return
    }
    setLoadingText('Đang tạo tài khoản...')
    setLoading(true)
    try {
      await registerCustomer(registerForm)
      navigate('/', { replace: true })
    } catch (err) {
      setError(readableError(err, 'Đăng ký thất bại'))
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  const submitAdminLogin = async (e) => {
    e.preventDefault()
    clearFeedback()
    const formData = new FormData(e.currentTarget)
    const credentials = {
      email: formData.get('email') || adminForm.email,
      password: formData.get('password') || adminForm.password,
    }
    setLoadingText('Đang kết nối bảng quản trị...')
    setLoading(true)
    try {
      const u = await login(credentials)
      navigate(u.role === 'admin' ? redirectTo : '/', { replace: true })
    } catch (err) {
      setError(readableError(err, 'Đăng nhập thất bại'))
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  const switchCustomerMode = (mode) => {
    setCustomerMode(mode)
    clearFeedback()
  }

  const switchTab = (nextTab) => {
    setTab(nextTab)
    clearFeedback()
  }

  return (
    <main className="auth-page">
      <aside className="auth-art">
        <div>
          <Link to="/" className="brand">
            <div className="brand-mark">HD</div>
            <div>HuyDeBug Spa<small>Sang trọng · Đẳng cấp</small></div>
          </Link>
          <h2 style={{ marginTop: 64 }}>
            Không gian thư giãn<br />
            <em style={{ color: '#e7c794', fontFamily: 'inherit', fontStyle: 'italic' }}>dành riêng cho bạn.</em>
          </h2>
        </div>
        <p className="quote">
          "Đăng nhập để quản lý lịch hẹn, lưu thông tin cá nhân và nhận ưu đãi chăm sóc định kỳ."
        </p>
      </aside>

      <section className="auth-form">
        <div className="wrap">
          {loading && (
            <div className="auth-loading" role="status" aria-live="polite">
              <span className="loader-ring" />
              <strong>{loadingText || 'Đang xử lý...'}</strong>
              <small>Vui lòng chờ trong giây lát</small>
            </div>
          )}

          <span className="eyebrow">Tài khoản</span>
          <h3>{tab === 'customer' ? 'Khách hàng HuyDeBug Spa' : 'Bảng điều khiển quản trị'}</h3>
          <p className="sub">
            {tab === 'customer'
              ? 'Đăng nhập hoặc tạo tài khoản nhanh để đặt lịch và lưu thông tin.'
              : 'Dành riêng cho nhân sự được cấp quyền quản trị.'}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Chọn loại tài khoản">
            <button type="button" className={tab === 'customer' ? 'active' : ''} onClick={() => switchTab('customer')}>
              Khách hàng
            </button>
            <button type="button" className={tab === 'admin' ? 'active' : ''} onClick={() => switchTab('admin')}>
              Quản trị
            </button>
          </div>

          {tab === 'customer' ? (
            <>
              <div className="auth-mode">
                <button type="button" className={customerMode === 'login' ? 'active' : ''} onClick={() => switchCustomerMode('login')}>
                  Đăng nhập
                </button>
                <button type="button" className={customerMode === 'register' ? 'active' : ''} onClick={() => switchCustomerMode('register')}>
                  Đăng ký
                </button>
              </div>

              {error && <div className="form-error">{error}</div>}
              {notice && <div className="form-success">{notice}</div>}

              {customerMode === 'login' ? (
                <form className="form" onSubmit={submitCustomerLogin}>
                  <div className="field">
                    <label>Email hoặc số điện thoại</label>
                    <input
                      value={loginForm.contact}
                      onChange={(e) => setLoginForm({ ...loginForm, contact: e.target.value })}
                      placeholder="ban@example.com hoặc 0901234567"
                      autoComplete="username"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </button>
                </form>
              ) : (
                <form className="form" onSubmit={submitCustomerRegister}>
                  <div className="field">
                    <label>Họ và tên</label>
                    <input
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="ban@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Số điện thoại</label>
                      <input
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="0901234567"
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <form className="form" onSubmit={submitAdminLogin}>
              {error && <div className="form-error">{error}</div>}

              <div className="field">
                <label>Email quản trị</label>
                <input
                  type="email"
                  name="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@huydebug-spa.vn"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Mật khẩu quản trị"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập quản trị'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
