// HuyDeBug Spa - Admin layout (sidebar + outlet)
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSpaData } from '../../context/SpaDataContext'

const items = [
  { to: '/admin', label: 'Tổng quan', icon: '◈', end: true },
  { to: '/admin/bookings', label: 'Lịch hẹn', icon: '◵' },
  { to: '/admin/services', label: 'Dịch vụ', icon: '✦' },
  { to: '/admin/customers', label: 'Khách hàng', icon: '◍' },
  { to: '/admin/accounts', label: 'Tài khoản', icon: '◐' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { refresh } = useSpaData()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh()
    }, 0)
    return () => clearTimeout(timer)
  }, [refresh])

  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand">
          <div className="brand-mark">HD</div>
          <div>HuyDeBug<small>Admin Panel</small></div>
        </Link>

        <nav className="admin-nav">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}>
              <span className="ico">{it.icon}</span> {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-side-foot">
          <div style={{ marginBottom: 14 }}>
            <strong style={{ color: '#fff', display: 'block' }}>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <button onClick={onLogout} className="btn btn-light btn-sm">Đăng xuất</button>
          <p style={{ marginTop: 24, opacity: 0.6 }}>v0.1.0 · Built by HuyDeBug</p>
        </div>
      </aside>

      <main className="admin-main fade-in">
        <Outlet />
      </main>
    </div>
  )
}
