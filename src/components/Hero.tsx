import type { Shop } from '../data/site-data'
import type { contactLinks } from '../lib/contact-links'

type Props = { shop: Shop; links: ReturnType<typeof contactLinks> }

export default function Hero({ shop, links }: Props) {
  return (
    <div className="hero" id="top">
      <div className="wrap">
        <h1>{shop.tagline}</h1>
        <p>{shop.description}</p>
        <div className="actions">
          <a className="btn btn-zalo" href={links.zalo} target="_blank" rel="noopener noreferrer">Nhắn Zalo</a>
          <a className="btn btn-tg" href={links.telegram} target="_blank" rel="noopener noreferrer">Nhắn Telegram</a>
        </div>
        <div className="points">
          {shop.highlights.map((h) => (
            <span key={h}>✔ {h}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
