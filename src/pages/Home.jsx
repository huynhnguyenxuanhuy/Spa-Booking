// HuyDeBug Spa - Home page
import { Link } from 'react-router-dom'
import ServiceCard from '../components/ServiceCard'
import { useSpaData } from '../context/SpaDataContext'
import { testimonials } from '../data/mockData'

export default function Home() {
  const { services } = useSpaData()
  const featured = services.slice(0, 3)

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner fade-in">
          <span className="eyebrow" style={{ color: '#e7c794' }}>Welcome to HuyDeBug Spa</span>
          <h1>
            Nâng niu vẻ đẹp <em>đẳng cấp</em><br />
            đánh thức cảm giác thư giãn
          </h1>
          <p className="lead">
            Hệ thống spa cao cấp với liệu trình chăm sóc da, massage trị liệu và các gói detox được
            thiết kế riêng cho bạn — bởi đội ngũ chuyên gia hàng đầu.
          </p>
          <div className="hero-cta">
            <Link to="/dat-lich" className="btn btn-primary">Đặt lịch ngay →</Link>
            <Link to="/dich-vu" className="btn btn-light">Khám phá dịch vụ</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><strong>12K+</strong><span>Khách hàng VIP</span></div>
            <div className="stat"><strong>30+</strong><span>Liệu trình cao cấp</span></div>
            <div className="stat"><strong>4.9★</strong><span>Đánh giá trung bình</span></div>
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Liệu trình nổi bật</span>
            <h2>Trải nghiệm thư giãn đẳng cấp</h2>
            <p>
              Mỗi liệu trình tại HuyDeBug Spa đều được nghiên cứu kỹ lưỡng, sử dụng nguyên liệu cao cấp
              nhất để mang đến kết quả vượt mong đợi.
            </p>
          </div>
          <div className="grid-services">
            {featured.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/dich-vu" className="btn btn-ghost">Xem tất cả dịch vụ →</Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="section" style={{ background: 'var(--c-bg-soft)' }}>
        <div className="container about">
          <div>
            <span className="eyebrow">Về HuyDeBug Spa</span>
            <h2>Không gian sang trọng,<br />trải nghiệm đẳng cấp 5 sao</h2>
            <p style={{ marginTop: 18, color: 'var(--c-ink-soft)' }}>
              Lấy cảm hứng từ các spa danh tiếng tại Bali và Pháp, HuyDeBug Spa kiến tạo không gian
              thư giãn riêng tư với hương trầm thanh khiết, ánh nến ấm áp và âm nhạc thiền định.
            </p>
            <ul>
              <li>Đội ngũ KTV chứng chỉ quốc tế CIDESCO, ITEC</li>
              <li>Sản phẩm cao cấp nhập khẩu từ Pháp, Ý, Nhật</li>
              <li>Quy trình vệ sinh chuẩn 5 sao, dụng cụ tiệt trùng riêng từng khách</li>
              <li>Tư vấn liệu trình cá nhân hoá theo cơ địa</li>
            </ul>
            <div style={{ marginTop: 28 }}>
              <Link to="/ve-chung-toi" className="btn btn-ghost">Tìm hiểu thêm</Link>
            </div>
          </div>
          <div className="about-img">
            <img
              src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=900&q=80"
              alt="HuyDeBug Spa space"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section testimonials">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Khách hàng nói gì</span>
            <h2>Trải nghiệm của những vị khách thân thiết</h2>
          </div>
          <div className="t-grid">
            {testimonials.map((t) => (
              <div key={t.id} className="t-card">
                <div className="stars">{'★'.repeat(t.rating)}</div>
                <blockquote>"{t.quote}"</blockquote>
                <div className="who">
                  <div className="av">{t.name[0]}</div>
                  <div>
                    <strong>{t.name}</strong><br />
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div>
              <h2>Sẵn sàng cho buổi spa của riêng bạn?</h2>
              <p>Đặt lịch ngay hôm nay để nhận ưu đãi 15% cho khách hàng mới.</p>
            </div>
            <div className="actions">
              <Link to="/dat-lich" className="btn btn-light">Đặt lịch</Link>
              <a href="tel:+84900000000" className="btn btn-ghost" style={{ borderColor: '#fff', color: '#fff' }}>Gọi tư vấn</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
