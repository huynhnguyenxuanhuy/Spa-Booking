// HuyDeBug Spa - Admin: customers
import { useState, useMemo } from 'react'
import { useSpaData } from '../../context/SpaDataContext'
import { formatVND } from '../../data/mockData'

const tierColor = (t) =>
  t === 'Bạch kim' ? 'badge-success' : t === 'Vàng' ? 'badge-gold' : 'badge'

export default function AdminCustomers() {
  const { customers } = useSpaData()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return customers
    return customers.filter((c) =>
      c.name.toLowerCase().includes(keyword) ||
      c.phone.includes(keyword) ||
      c.email?.toLowerCase().includes(keyword),
    )
  }, [customers, q])

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Khách hàng</h1>
          <p style={{ color: 'var(--c-muted)' }}>Danh sách khách hàng VIP & lịch sử chi tiêu.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Tổng {customers.length} khách hàng</h3>
          <input className="search" placeholder="Tìm tên hoặc SĐT…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Khách hàng</th><th>SĐT</th><th>Số lần ghé</th><th>Tổng chi tiêu</th><th>Hạng</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: 'var(--grad-gold)', color: '#fff',
                        display: 'grid', placeItems: 'center', fontWeight: 600,
                      }}>{c.name[0]}</div>
                      <div>
                        <strong>{c.name}</strong><br />
                        <small style={{ color: 'var(--c-muted)' }}>{c.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.visits}</td>
                  <td><strong>{formatVND(c.totalSpend)}</strong></td>
                  <td><span className={`badge ${tierColor(c.tier)}`}>{c.tier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
