// HuyDeBug Spa - Admin: services management
import { useState } from 'react'
import { useSpaData } from '../../context/SpaDataContext'
import { formatVND } from '../../data/mockData'

const empty = {
  id: '',
  name: '',
  category: 'Chăm sóc da',
  duration: 60,
  price: 1000000,
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
  description: '',
  highlights: [],
}

export default function AdminServices() {
  const { services, upsertService, removeService } = useSpaData()
  const [editing, setEditing] = useState(null)

  const onSave = async (e) => {
    e.preventDefault()
    await upsertService({
      ...editing,
      price: Number(editing.price),
      duration: Number(editing.duration),
    })
    setEditing(null)
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Quản lý dịch vụ</h1>
          <p style={{ color: 'var(--c-muted)' }}>Thêm, chỉnh sửa và quản lý các liệu trình của HuyDeBug Spa.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing(empty)}>+ Thêm dịch vụ</button>
      </div>

      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Dịch vụ</th><th>Danh mục</th><th>Thời lượng</th><th>Giá</th><th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img src={s.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                      <div>
                        <strong>{s.name}</strong><br />
                        <small style={{ color: 'var(--c-muted)' }}>{s.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>{s.category}</td>
                  <td>{s.duration} phút</td>
                  <td><strong>{formatVND(s.price)}</strong></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => setEditing(s)} title="Sửa">✎</button>
                      <button
                        className="icon-btn danger"
                        title="Xoá"
                        onClick={() => {
                          if (window.confirm(`Xoá dịch vụ "${s.name}"?`)) removeService(s.id)
                        }}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
            <form className="form" onSubmit={onSave}>
              <div className="field">
                <label>Tên dịch vụ</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Danh mục</label>
                  <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div className="field">
                  <label>Thời lượng (phút)</label>
                  <input type="number" value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Giá (VND)</label>
                <input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </div>
              <div className="field">
                <label>Ảnh URL</label>
                <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
              </div>
              <div className="field">
                <label>Mô tả</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Huỷ</button>
                <button type="submit" className="btn btn-primary btn-sm">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
