// HuyDeBug Spa - Admin: bookings management
import { useMemo, useState } from 'react'
import { useSpaData } from '../../context/SpaDataContext'

export default function AdminBookings() {
  const { bookings, services, updateBookingStatus, removeBooking } = useSpaData()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchQ =
        !q ||
        b.id.toLowerCase().includes(q.toLowerCase()) ||
        b.customerName.toLowerCase().includes(q.toLowerCase()) ||
        b.phone.includes(q)
      const matchF = filter === 'all' || b.status === filter
      return matchQ && matchF
    })
  }, [bookings, q, filter])

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Quản lý lịch hẹn</h1>
          <p style={{ color: 'var(--c-muted)' }}>Theo dõi, xác nhận và quản lý booking của khách hàng.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="tools">
            {['all', 'pending', 'confirmed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`chip ${filter === s ? 'active' : ''}`}
                style={{ marginBottom: 0 }}
              >
                {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Đang chờ' : s === 'confirmed' ? 'Đã xác nhận' : 'Đã huỷ'}
                <span style={{ marginLeft: 6, opacity: 0.6 }}>
                  {s === 'all' ? bookings.length : bookings.filter((b) => b.status === s).length}
                </span>
              </button>
            ))}
          </div>
          <div className="tools">
            <input className="search" placeholder="Tìm theo mã, tên, số điện thoại…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {filtered.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Mã</th><th>Khách hàng</th><th>Dịch vụ</th><th>Lịch hẹn</th><th>Trạng thái</th><th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const svc = services.find((s) => s.id === b.serviceId)
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.id}</strong></td>
                      <td>
                        <div>{b.customerName}</div>
                        <small style={{ color: 'var(--c-muted)' }}>{b.phone}</small>
                      </td>
                      <td>{svc?.name || '—'}</td>
                      <td>
                        {b.date}<br />
                        <small style={{ color: 'var(--c-muted)' }}>{b.time}</small>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={b.status}
                          onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                          style={{
                            color: b.status === 'confirmed' ? 'var(--c-success)' :
                                   b.status === 'cancelled' ? 'var(--c-danger)' : 'var(--c-gold-deep)',
                          }}
                        >
                          <option value="pending">Đang chờ</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="cancelled">Đã huỷ</option>
                        </select>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn danger"
                            onClick={() => {
                              if (window.confirm(`Xoá booking ${b.id}?`)) removeBooking(b.id)
                            }}
                            title="Xoá"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><div className="ico">○</div>Không có booking phù hợp.</div>
        )}
      </div>
    </>
  )
}
