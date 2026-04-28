// HuyDeBug Spa - Protected route for admin area
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--c-muted)' }}>Đang kiểm tra phiên đăng nhập…</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />
  return children
}
