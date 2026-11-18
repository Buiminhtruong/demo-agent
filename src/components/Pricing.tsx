import type { ProxyType } from '../data/site-data'
import type { contactLinks } from '../lib/contact-links'
import { formatPrice } from '../lib/format-price'

type Props = {
  types: ProxyType[]
  selectedId: string
  onSelect: (id: string) => void
  links: ReturnType<typeof contactLinks>
}

export default function Pricing({ types, selectedId, onSelect, links }: Props) {
  const selected = types.find((t) => t.id === selectedId) ?? types[0]
  return (
    <section id="bang-gia" className="alt-bg">
      <div className="wrap">
        <h2>Bảng giá</h2>
        <p className="sub">Giá đã gồm hỗ trợ kỹ thuật</p>
        <div className="tabs" role="tablist" aria-label="Loại proxy">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={t.id === selected?.id}
              aria-controls="plan-panel"
              className={t.id === selected?.id ? 'tab active' : 'tab'}
              onClick={() => onSelect(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="grid3" role="tabpanel" id="plan-panel" aria-labelledby={selected ? `tab-${selected.id}` : undefined}>
          {selected?.plans.map((p) => (
            <div key={p.code} className={p.popular ? 'card plan popular' : 'card plan'}>
              {p.popular && <span className="badge">Phổ biến</span>}
              <h3>{p.name}</h3>
              <span className="code">{p.code}</span>
              <span className="duration">Thời hạn: {p.duration}</span>
              <div className="price">
                {formatPrice(p.price)} <small>/ 1 IP</small>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a className="btn btn-zalo" href={links.zalo} target="_blank" rel="noopener noreferrer">Mua qua Zalo</a>
              <a className="alt" href={links.telegram} target="_blank" rel="noopener noreferrer">hoặc Telegram</a>
            </div>
          ))}
        </div>
        <p className="note">Khi nhắn, gửi kèm <b>mã gói</b> để được xử lý nhanh.</p>
      </div>
    </section>
  )
}
