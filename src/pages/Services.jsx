// HuyDeBug Spa - Services listing
import { useMemo, useState } from 'react'
import ServiceCard from '../components/ServiceCard'
import { useSpaData } from '../context/SpaDataContext'

export default function Services() {
  const { services } = useSpaData()
  const [filter, setFilter] = useState('Tất cả')

  const categories = useMemo(
    () => ['Tất cả', ...Array.from(new Set(services.map((s) => s.category)))],
    [services],
  )
  const visible = filter === 'Tất cả' ? services : services.filter((s) => s.category === filter)

  return (
    <main>
      <section className="page-intro">
        <div className="container fade-in">
          <span className="eyebrow">Dịch vụ</span>
          <h1>Bộ sưu tập liệu trình cao cấp</h1>
          <p>Khám phá hơn 30+ liệu trình thư giãn, làm đẹp được thiết kế tinh tế dành riêng cho bạn.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="chips">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`chip ${filter === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>

          {visible.length ? (
            <div className="grid-services">
              {visible.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          ) : (
            <div className="empty">
              <div className="ico">✨</div>
              <p>Chưa có dịch vụ phù hợp.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
