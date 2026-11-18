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
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              <p className="use">Dùng cho: {t.useCases}</p>
              {t.plans.length > 0 && <div className="from">từ {formatPrice(minPrice(t))}</div>}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
