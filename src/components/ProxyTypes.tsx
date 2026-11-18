import type { ProxyType } from '../data/site-data'
import { formatPrice } from '../lib/format-price'
import { minPrice } from '../lib/min-price'

type Props = { types: ProxyType[]; onSelect: (id: string) => void }

export default function ProxyTypes({ types, onSelect }: Props) {
  return (
    <section id="loai-proxy">
      <div className="wrap">
        <h2>Loại proxy</h2>
        <p className="sub">Chọn loại phù hợp với việc bạn cần</p>
        <div className="grid3">
          {types.map((t) => (
            <button key={t.id} type="button" className="card type-card" onClick={() => onSelect(t.id)}>
              <span className="type-name">{t.name}</span>
              <span className="type-desc">{t.description}</span>
              <span className="use">Dùng cho: {t.useCases}</span>
              {t.plans.length > 0 && <span className="from">từ {formatPrice(minPrice(t))}</span>}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
