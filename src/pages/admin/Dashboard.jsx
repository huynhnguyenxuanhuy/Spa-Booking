// HuyDeBug Spa - Admin Dashboard (overview)
import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSpaData } from '../../context/SpaDataContext'
import { formatVND } from '../../data/mockData'

const COLORS = ['#c9a66b', '#8a6a36', '#e8c5c0', '#4a7c59', '#b85b5b', '#1f1a17']

function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = 70, c = 100
  const slices = data.map((d, i) => {
    const before = data.slice(0, i).reduce((s, x) => s + x.value, 0)
    const start = (before / total) * Math.PI * 2 - Math.PI / 2
    const end = ((before + d.value) / total) * Math.PI * 2 - Math.PI / 2
    return { ...d, start, end }
  })
  return (
    <svg viewBox="0 0 200 200">
      {slices.map((d, i) => {
        const large = d.end - d.start > Math.PI ? 1 : 0
        const x1 = c + r * Math.cos(d.start)
        const y1 = c + r * Math.sin(d.start)
        const x2 = c + r * Math.cos(d.end)
        const y2 = c + r * Math.sin(d.end)
        const path = `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
        return <path key={i} d={path} fill={COLORS[i % COLORS.length]} />
      })}
      <circle cx={c} cy={c} r={42} fill="#fff" />
      <text x={c} y={c - 4} textAnchor="middle" fontFamily="Cormorant Garamond" fontSize="22" fontWeight="600" fill="#1f1a17">
        {total}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="9" letterSpacing="2" fill="#8a7a6a">TỔNG</text>
    </svg>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { bookings, services, customers } = useSpaData()

  const kpi = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todays = bookings.filter((b) => b.date === today)
    const confirmed = bookings.filter((b) => b.status === 'confirmed')
    const revenue = confirmed.reduce((sum, b) => {
      const s = services.find((x) => x.id === b.serviceId)
      return sum + (s?.price || 0)
    }, 0)
    return {
      total: bookings.length,
      today: todays.length,
      confirmed: confirmed.length,
      revenue,
    }
  }, [bookings, services])

  const statusBreakdown = useMemo(() => {
    const groups = { confirmed: 0, pending: 0, cancelled: 0 }
    bookings.forEach((b) => { groups[b.status] = (groups[b.status] || 0) + 1 })
    return [
      { label: 'Đã xác nhận', value: groups.confirmed, color: '#4a7c59' },
      { label: 'Đang chờ', value: groups.pending, color: '#c9a66b' },
      { label: 'Đã huỷ', value: groups.cancelled, color: '#b85b5b' },
    ]
  }, [bookings])

  // Doanh thu mock 7 ngày gần nhất
  const last7 = useMemo(() => {
    const arr = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const v = 6 + Math.round(Math.sin(i * 1.3) * 2 + Math.cos(i * 0.7) * 1.6) + (i === 0 ? kpi.today : 0)
      arr.push({ d: d.toLocaleDateString('vi-VN', { weekday: 'short' }), v: Math.max(2, v) })
    }
    return arr
  }, [kpi.today])
  const maxV = Math.max(...last7.map((x) => x.v))

  const recent = bookings.slice(0, 5)

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Xin chào, {user?.name?.split(' ').slice(-1) || 'Admin'} 👋</h1>
          <p style={{ color: 'var(--c-muted)' }}>Đây là tổng quan hoạt động của HuyDeBug Spa hôm nay.</p>
        </div>
        <div className="admin-user">
          <div className="av">{user?.avatar || 'HD'}</div>
          <div className="meta">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="ico-bg" />
          <span className="label">Lịch hôm nay</span>
          <span className="value">{kpi.today}</span>
          <span className="delta">▲ {Math.max(1, kpi.today)} so với hôm qua</span>
        </div>
        <div className="kpi-card">
          <div className="ico-bg" />
          <span className="label">Tổng booking</span>
          <span className="value">{kpi.total}</span>
          <span className="delta">▲ 12% tháng này</span>
        </div>
        <div className="kpi-card">
          <div className="ico-bg" />
          <span className="label">Doanh thu xác nhận</span>
          <span className="value" style={{ fontSize: '1.6rem' }}>{formatVND(kpi.revenue)}</span>
          <span className="delta">▲ Trên đà tăng trưởng</span>
        </div>
        <div className="kpi-card">
          <div className="ico-bg" />
          <span className="label">Khách VIP</span>
          <span className="value">{customers.filter((c) => c.tier === 'Bạch kim').length}</span>
          <span className="delta">▲ 2 khách mới tuần này</span>
        </div>
      </div>

      <div className="chart">
        <div className="panel">
          <div className="panel-head">
            <h3>Lịch hẹn 7 ngày qua</h3>
            <span className="badge badge-gold">Real-time</span>
          </div>
          <div className="bars">
            {last7.map((x, i) => (
              <div
                key={i}
                className={`bar ${i === last7.length - 1 ? '' : 'muted'}`}
                style={{ height: `${(x.v / maxV) * 100}%` }}
                title={`${x.d}: ${x.v}`}
              >
                {x.v}
              </div>
            ))}
          </div>
          <div className="bar-labels">
            {last7.map((x, i) => <span key={i}>{x.d}</span>)}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Phân loại trạng thái</h3>
          </div>
          <div className="donut">
            <Donut data={statusBreakdown} />
          </div>
          <div className="donut-legend">
            {statusBreakdown.map((s, i) => (
              <div className="row" key={i}>
                <span className="dot" style={{ background: s.color }} />
                <span style={{ flex: 1 }}>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Lịch hẹn gần đây</h3>
        </div>
        {recent.length ? (
          <table className="data">
            <thead>
              <tr>
                <th>Mã</th><th>Khách</th><th>Dịch vụ</th><th>Ngày</th><th>Giờ</th><th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => {
                const svc = services.find((s) => s.id === b.serviceId)
                return (
                  <tr key={b.id}>
                    <td><strong>{b.id}</strong></td>
                    <td>{b.customerName}</td>
                    <td>{svc?.name || '—'}</td>
                    <td>{b.date}</td>
                    <td>{b.time}</td>
                    <td>
                      <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-warn'}`}>
                        {b.status === 'confirmed' ? 'Đã xác nhận' : b.status === 'cancelled' ? 'Đã huỷ' : 'Đang chờ'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : <div className="empty">Chưa có lịch hẹn.</div>}
      </div>
    </>
  )
}
