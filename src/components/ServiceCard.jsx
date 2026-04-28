// HuyDeBug Spa - Service card
import { Link } from 'react-router-dom'
import { formatVND } from '../data/mockData'

export default function ServiceCard({ service }) {
  return (
    <article className="svc-card rise-in">
      <div className="img">
        <img src={service.image} alt={service.name} loading="lazy" />
      </div>
      <div className="body">
        <span className="cat">{service.category}</span>
        <h3>{service.name}</h3>
        <p className="desc">{service.description}</p>
        <div className="meta">
          <span className="price">{formatVND(service.price)}</span>
          <span className="duration">{service.duration} phút</span>
        </div>
        <Link
          to={`/dat-lich?service=${service.id}`}
          className="btn btn-primary btn-sm"
          style={{ marginTop: 16, alignSelf: 'flex-start' }}
        >
          Đặt liệu trình →
        </Link>
      </div>
    </article>
  )
}
