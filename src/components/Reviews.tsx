import type { ProxyType, Review } from '../data/site-data'
import { initials } from '../lib/initials'

type Props = { items: Review[]; types: ProxyType[]; sample: boolean }

// Làm tròn và kẹp trong 0–5 để số sao nhập sai (4.5, 7, -1) không làm trắng trang
const clampRating = (n: number) => Math.min(5, Math.max(0, Math.round(n)))
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function Reviews({ items, types, sample }: Props) {
  const typeName = (id: string) => types.find((t) => t.id === id)?.name

  return (
    <section id="danh-gia">
      <div className="wrap">
        <h2>Khách hàng nói gì</h2>
        <p className="sub">Cảm nhận của khách đã dùng proxy tại shop</p>
        <div className="grid3">
          {items.map((r, i) => {
            const used = typeName(r.proxyTypeId)
            const rating = clampRating(r.rating)
            return (
              <figure key={i} className="card review">
                <div className="stars" role="img" aria-label={`${rating} trên 5 sao`}>
                  {stars(rating)}
                </div>
                <blockquote>“{r.text}”</blockquote>
                <figcaption className="who">
                  <span className="avatar" aria-hidden="true">{initials(r.name)}</span>
                  <span>
                    <b>{r.name}</b>
                    {used && <small>Dùng {used}</small>}
                  </span>
                </figcaption>
              </figure>
            )
          })}
        </div>
        {sample && <p className="note">Nội dung đánh giá đang là dữ liệu mẫu.</p>}
      </div>
    </section>
  )
}
