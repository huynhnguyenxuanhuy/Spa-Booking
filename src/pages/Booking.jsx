// HuyDeBug Spa - Booking page
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Toast from '../components/Toast'
import { useSpaData } from '../context/SpaDataContext'
import { formatVND } from '../data/mockData'

const TIME_SLOTS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30', '20:00']

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function Booking() {
  const { services, addBooking } = useSpaData()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [toast, setToast] = useState('')

  const [form, setForm] = useState(() => ({
    customerName: '',
    phone: '',
    email: '',
    serviceId: params.get('service') || services[0]?.id || '',
    date: tomorrow(),
    time: TIME_SLOTS[0],
    note: '',
  }))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selected = useMemo(
    () => services.find((s) => s.id === form.serviceId),
    [services, form.serviceId],
  )

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.customerName.trim() || !form.phone.trim() || !form.serviceId || !form.date) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.')
      return
    }
    setSubmitting(true)
    // Giả lập độ trễ network
    await new Promise((r) => setTimeout(r, 700))
    const id = await addBooking(form)
    setSubmitting(false)
    setToast(`Đặt lịch thành công! Mã ${id}`)
    setTimeout(() => navigate('/'), 1800)
  }

  return (
    <main>
      <section className="page-intro">
        <div className="container fade-in">
          <span className="eyebrow">Đặt lịch</span>
          <h1>Lựa chọn liệu trình<br />và thời gian phù hợp</h1>
          <p>Đội ngũ HuyDeBug Spa sẽ liên hệ xác nhận lịch hẹn trong vòng 15 phút.</p>
        </div>
      </section>

      <section className="section">
        <div className="container booking-grid">
          <form className="form" onSubmit={onSubmit}>
            {error && <div className="form-error">{error}</div>}

            <div className="form-row">
              <div className="field">
                <label>Họ và tên *</label>
                <input value={form.customerName} onChange={onChange('customerName')} placeholder="Nguyễn Văn A" required />
              </div>
              <div className="field">
                <label>Số điện thoại *</label>
                <input value={form.phone} onChange={onChange('phone')} placeholder="0903 123 456" required />
              </div>
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={onChange('email')} placeholder="ban@example.com" />
            </div>

            <div className="field">
              <label>Dịch vụ *</label>
              <select value={form.serviceId} onChange={onChange('serviceId')} required>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {formatVND(s.price)}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Ngày *</label>
                <input type="date" value={form.date} onChange={onChange('date')} required min={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="field">
                <label>Giờ *</label>
                <select value={form.time} onChange={onChange('time')} required>
                  {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Ghi chú</label>
              <textarea value={form.note} onChange={onChange('note')} placeholder="Yêu cầu đặc biệt (KTV nữ, phòng yên tĩnh, dị ứng,...)" />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Đang gửi…' : 'Xác nhận đặt lịch'}
            </button>
          </form>

          <aside className="summary-card">
            <h4>Tóm tắt lịch hẹn</h4>
            {selected && (
              <>
                <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                  <img src={selected.image} alt={selected.name} style={{ aspectRatio: '5/3', objectFit: 'cover', width: '100%' }} />
                </div>
                <div className="line"><span>Dịch vụ</span><strong>{selected.name}</strong></div>
                <div className="line"><span>Thời lượng</span><strong>{selected.duration} phút</strong></div>
              </>
            )}
            <div className="line"><span>Ngày</span><strong>{form.date || '—'}</strong></div>
            <div className="line"><span>Giờ</span><strong>{form.time}</strong></div>
            <div className="line"><span>Tổng tạm tính</span><span className="total">{selected ? formatVND(selected.price) : '—'}</span></div>
            <p style={{ marginTop: 14, fontSize: '.84rem', color: 'var(--c-muted)' }}>
              * Thanh toán tại spa. Có thể huỷ miễn phí trước 12 giờ.
            </p>
          </aside>
        </div>
      </section>

      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
