// HuyDeBug Spa - About page
export default function About() {
  return (
    <main>
      <section className="page-intro">
        <div className="container fade-in">
          <span className="eyebrow">Câu chuyện</span>
          <h1>Hành trình kiến tạo<br />không gian thư giãn đẳng cấp</h1>
          <p>HuyDeBug Spa - nơi chăm sóc bản thân được nâng tầm thành một nghệ thuật.</p>
        </div>
      </section>

      <section className="section">
        <div className="container about">
          <div className="about-img">
            <img
              src="https://images.unsplash.com/photo-1591343395082-e120087004b4?w=900&q=80"
              alt="HuyDeBug Spa"
              loading="lazy"
            />
          </div>
          <div>
            <span className="eyebrow">Triết lý</span>
            <h2>Vẻ đẹp thật sự đến từ sự cân bằng</h2>
            <p style={{ marginTop: 18, color: 'var(--c-ink-soft)' }}>
              Ra đời năm 2018, HuyDeBug Spa là kết quả của hành trình tìm kiếm những liệu pháp chăm
              sóc bản thân đỉnh cao trên khắp thế giới. Từ những trị liệu cổ truyền của Bali đến tinh
              hoa khoa học làm đẹp Pháp - chúng tôi chắt lọc và mang về Việt Nam.
            </p>
            <ul>
              <li>3 chi nhánh tại TP.HCM, Hà Nội và Đà Nẵng</li>
              <li>Hơn 50 chuyên gia trị liệu được đào tạo bài bản</li>
              <li>12,000+ khách hàng VIP đặt niềm tin</li>
              <li>Đối tác chính thức của Sothys, Babor và Decléor</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--c-bg-soft)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Giá trị cốt lõi</span>
            <h2>Bốn cam kết với mỗi vị khách</h2>
          </div>
          <div className="grid-services">
            {[
              { t: 'Riêng tư tuyệt đối', d: 'Phòng VIP cách âm, dụng cụ riêng từng khách.' },
              { t: 'Nguyên liệu cao cấp', d: 'Mỹ phẩm hữu cơ, nhập khẩu chính hãng.' },
              { t: 'Chuyên gia tận tâm', d: 'KTV chứng chỉ quốc tế, đào tạo định kỳ.' },
              { t: 'Trải nghiệm cá nhân hoá', d: 'Liệu trình thiết kế riêng theo cơ địa và nhu cầu.' },
            ].map((c, i) => (
              <article key={i} className="svc-card" style={{ padding: 28 }}>
                <span className="cat">0{i + 1}</span>
                <h3 style={{ marginTop: 8 }}>{c.t}</h3>
                <p className="desc">{c.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
