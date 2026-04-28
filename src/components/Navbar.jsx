// HuyDeBug Spa - Navbar
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/dich-vu', label: 'Dịch vụ' },
  { to: '/dat-lich', label: 'Đặt lịch' },
  { to: '/ve-chung-toi', label: 'Về chúng tôi' },
  { to: '/lien-he', label: 'Liên hệ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <div className="brand-mark">HD</div>
          <div>
            HuyDeBug Spa
            <small>Sang trọng · Đẳng cấp</small>
          </div>
        </Link>

        <nav className="nav-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-cta">
          {isAdmin ? (
            <>
              <Link to="/admin" className="btn btn-ghost btn-sm">Bảng điều khiển</Link>
              <button onClick={onLogout} className="btn btn-primary btn-sm">Đăng xuất</button>
            </>
          ) : user ? (
            <>
              <span className="nav-user">Xin chào, {user.name?.split(' ').slice(-1) || 'khách'}</span>
              <button onClick={onLogout} className="btn btn-ghost btn-sm">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Đăng nhập</Link>
              <Link to="/dat-lich" className="btn btn-primary btn-sm">Đặt lịch ngay</Link>
            </>
          )}
          <button className="nav-burger" aria-label="menu" onClick={() => setOpen((v) => !v)}>
            ☰
          </button>
        </div>

        {open && (
          <div className="nav-mobile" onClick={() => setOpen(false)}>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
            ))}
            {isAdmin && <NavLink to="/admin">Bảng điều khiển</NavLink>}
            {!user && <NavLink to="/login">Đăng nhập</NavLink>}
            {user && <button onClick={onLogout} className="mobile-logout">Đăng xuất</button>}
          </div>
        )}
      </div>
    </header>
  )
}
