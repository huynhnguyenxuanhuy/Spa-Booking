// HuyDeBug Spa - Footer
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <div className="brand-mark">HD</div>
              <div>
                HuyDeBug Spa
                <small>Sang trọng · Đẳng cấp</small>
              </div>
            </Link>
            <p style={{ marginTop: 16, maxWidth: 320, color: 'rgba(255,255,255,0.7)' }}>
              Hệ thống spa cao cấp với đội ngũ chuyên gia hàng đầu, không gian thư giãn đẳng cấp 5 sao.
            </p>
          </div>

          <div>
            <h4>Khám phá</h4>
            <Link to="/">Trang chủ</Link>
            <Link to="/dich-vu">Dịch vụ</Link>
            <Link to="/dat-lich">Đặt lịch</Link>
            <Link to="/ve-chung-toi">Về chúng tôi</Link>
          </div>

          <div>
            <h4>Liên hệ</h4>
            <a href="tel:0775486811">0775 486 811</a>
            <a href="https://zalo.me/0775486811" target="_blank" rel="noreferrer">Zalo: 0775 486 811</a>
            <a href="mailto:xuanhuy132005@gmail.com">xuanhuy132005@gmail.com</a>
            <span style={{ display: 'block', padding: '6px 0' }}>123 Nguyễn Huệ, Q.1, TP.HCM</span>
            <a
              href="https://www.facebook.com/emm.huy.526/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-light btn-sm footer-social"
            >
              Facebook
            </a>
          </div>

          <div>
            <h4>Giờ mở cửa</h4>
            <span style={{ display: 'block', padding: '6px 0' }}>T2 - T7: 9:00 - 22:00</span>
            <span style={{ display: 'block', padding: '6px 0' }}>Chủ nhật: 10:00 - 21:00</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} HuyDeBug Spa. All rights reserved.</span>
          <span>
            Crafted with <span style={{ color: '#e7c794' }}>♡</span> by{' '}
            <span className="signature">HuyDeBug</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
