import type { CompareValue, ProxyType } from '../data/site-data'
import { formatPrice } from '../lib/format-price'
import { minPrice } from '../lib/min-price'

type Props = { types: ProxyType[]; onSelect: (id: string) => void }

const fromPrice = (t: ProxyType) => (t.plans.length > 0 ? formatPrice(minPrice(t)) : '—')
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const level = (v: CompareValue) => (v.good ? 'good' : 'warn')

export default function Compare({ types, onSelect }: Props) {
  const rows: { label: string; cell: (t: ProxyType) => { text: string; cls?: string } }[] = [
    { label: 'Giá từ', cell: (t) => ({ text: fromPrice(t), cls: 'from' }) },
    { label: 'IP', cell: (t) => ({ text: t.compare.ip }) },
    { label: 'Độ ổn định', cell: (t) => ({ text: t.compare.stability.text, cls: level(t.compare.stability) }) },
    { label: 'Trang web hỗ trợ', cell: (t) => ({ text: t.compare.support.text, cls: level(t.compare.support) }) },
    { label: 'Hợp với', cell: (t) => ({ text: upperFirst(t.useCases) }) },
  ]

  const seePrice = (t: ProxyType) => (
    <button type="button" className="btn btn-outline" onClick={() => onSelect(t.id)}>
      Xem giá {t.name}
    </button>
  )

  return (
    <section id="so-sanh">
      <div className="wrap">
        <h2>So sánh các loại proxy</h2>
        <p className="sub">Chưa biết chọn loại nào? Xem nhanh điểm khác nhau</p>

        <table className="compare">
          <thead>
            <tr>
              <td />
              {types.map((t) => (
                <th key={t.id} scope="col">{t.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {types.map((t) => {
                  const c = r.cell(t)
                  return <td key={t.id} className={c.cls}>{c.text}</td>
                })}
              </tr>
            ))}
            <tr>
              <td />
              {types.map((t) => (
                <td key={t.id}>{seePrice(t)}</td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="cmp-cards">
          {types.map((t) => (
            <div key={t.id} className="card cmp-card">
              <h3>{t.name}</h3>
              <dl>
                {rows.map((r) => {
                  const c = r.cell(t)
                  return (
                    <div key={r.label} className="cmp-row">
                      <dt>{r.label}</dt>
                      <dd className={c.cls}>{c.text}</dd>
                    </div>
                  )
                })}
              </dl>
              {seePrice(t)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
