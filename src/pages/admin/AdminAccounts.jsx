// HuyDeBug Spa - Admin: account roles
import { useMemo, useState } from 'react'
import { useSpaData } from '../../context/SpaDataContext'

const roleLabel = (role) => (role === 'admin' ? 'Quản trị viên' : role === 'customer' ? 'Khách hàng' : 'Nhân viên')
const roleBadge = (role) => (role === 'admin' ? 'badge-success' : role === 'customer' ? 'badge-gold' : 'badge')
const statusLabel = (status) => (status === 'disabled' ? 'Tạm khoá' : 'Đang hoạt động')

export default function AdminAccounts() {
  const { users } = useSpaData()
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return users
    return users.filter((u) =>
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.role?.toLowerCase().includes(keyword),
    )
  }, [q, users])

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Tài khoản hệ thống</h1>
          <p style={{ color: 'var(--c-muted)' }}>Kiểm tra tài khoản đăng nhập và phân quyền trong hệ thống.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Tổng {users.length} tài khoản</h3>
          <input className="search" placeholder="Tìm email, tên hoặc quyền..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {list.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Tài khoản</th><th>Email</th><th>Quyền</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="av" style={{ width: 38, height: 38 }}>{u.avatar || u.name?.[0] || 'HD'}</div>
                        <div>
                          <strong>{u.name}</strong><br />
                          <small style={{ color: 'var(--c-muted)' }}>{u.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span></td>
                    <td><span className="badge badge-gold">{statusLabel(u.status)}</span></td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Chưa có'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Không có tài khoản phù hợp.</div>
        )}
      </div>
    </>
  )
}
