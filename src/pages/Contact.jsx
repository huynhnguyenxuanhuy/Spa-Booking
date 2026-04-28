// HuyDeBug Spa - Contact page
import { useState } from 'react'
import Toast from '../components/Toast'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [toast, setToast] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.message) return
    setToast('Đã gửi! HuyDeBug Spa sẽ phản hồi trong vòng 1 giờ.')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <main>
      <section className="page-intro">
        <div className="container fade-in">
          <span className="eyebrow">Liên hệ</span>
          <h1>Chúng tôi luôn lắng nghe bạn</h1>
          <p>Mọi thắc mắc, góp ý hay yêu cầu đặc biệt - đội ngũ HuyDeBug Spa sẵn sàng hỗ trợ 24/7.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <div className="row">
              <div className="ico">☎</div>
              <div>
                <strong>Hotline 24/7</strong><br />
                <a href="tel:0775486811">0775 486 811</a><br />
                <a href="https://zalo.me/0775486811" target="_blank" rel="noreferrer">Nhắn Zalo</a>
              </div>
            </div>
            <div className="row">
              <div className="ico">@</div>
              <div>
                <strong>Email</strong><br />
                <a href="mailto:xuanhuy132005@gmail.com">xuanhuy132005@gmail.com</a>
              </div>
            </div>
            <div className="row">
              <div className="ico">f</div>
              <div>
                <strong>Facebook</strong><br />
                <a href="https://www.facebook.com/emm.huy.526/" target="_blank" rel="noreferrer">facebook.com/emm.huy.526</a>
              </div>
            </div>
            <div className="row">
              <div className="ico">⌂</div>
              <div>
                <strong>Trụ sở</strong><br />
                123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
              </div>
            </div>
            <div className="row">
              <div className="ico">⏱</div>
              <div>
                <strong>Giờ mở cửa</strong><br />
                T2 - T7: 9:00 - 22:00 · CN: 10:00 - 21:00
              </div>
            </div>
          </div>

          <form className="form" onSubmit={onSubmit}>
            <h3>Gửi tin nhắn</h3>
            <div className="form-row">
              <div className="field">
                <label>Họ tên</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Nội dung</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Bạn cần hỗ trợ gì?" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Gửi tin nhắn</button>
          </form>
        </div>
      </section>

      <Toast message={toast} onClose={() => setToast('')} />
    </main>
  )
}
