// HuyDeBug Spa - 404
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="section" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div>
        <span className="eyebrow">404</span>
        <h1>Trang bạn tìm không tồn tại</h1>
        <p style={{ color: 'var(--c-muted)', marginTop: 12 }}>Có thể link đã bị thay đổi hoặc chưa được tạo.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 24 }}>Về trang chủ</Link>
      </div>
    </main>
  )
}
