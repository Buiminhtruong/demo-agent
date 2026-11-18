import type { Contact, Shop } from '../data/site-data'
import type { contactLinks } from '../lib/contact-links'

type Props = {
  shop: Shop
  contact: Contact
  links: ReturnType<typeof contactLinks>
}

export default function ContactFooter({ shop, contact, links }: Props) {
  return (
    <footer id="lien-he" className="site-footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <h4>{shop.name}</h4>
            <p>{shop.tagline}. Hỗ trợ {shop.supportHours}.</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul>
              <li>
                <a href={links.zalo} target="_blank" rel="noopener noreferrer">Zalo: {contact.zalo}</a>
              </li>
              <li>
                <a href={links.telegram} target="_blank" rel="noopener noreferrer">Telegram: {contact.telegram}</a>
              </li>
              <li>
                <a href={links.phone}>Gọi: {contact.phone}</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Trang</h4>
            <ul>
              <li><a href="#loai-proxy">Loại proxy</a></li>
              <li><a href="#bang-gia">Bảng giá</a></li>
              <li><a href="#hoi-dap">Hỏi đáp</a></li>
            </ul>
          </div>
        </div>
        <div className="copy">
          © {new Date().getFullYear()} {shop.name}. Số liên hệ là dữ liệu mẫu.
        </div>
      </div>
    </footer>
  )
}
