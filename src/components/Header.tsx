import { useState } from 'react'
import type { contactLinks } from '../lib/contact-links'

type Props = { shopName: string; links: ReturnType<typeof contactLinks> }

const menu = [
  { href: '#loai-proxy', label: 'Loại proxy' },
  { href: '#so-sanh', label: 'So sánh' },
  { href: '#chon-goi', label: 'Chọn gói' },
  { href: '#bang-gia', label: 'Bảng giá' },
  { href: '#danh-gia', label: 'Đánh giá' },
  { href: '#cach-mua', label: 'Cách mua' },
  { href: '#hoi-dap', label: 'Hỏi đáp' },
  { href: '#lien-he', label: 'Liên hệ' },
]

export default function Header({ shopName, links }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="wrap header-bar">
        <a className="logo" href="#top">{shopName}</a>
        <nav className={open ? 'open' : ''} aria-label="Menu chính">
          {menu.map((m) => (
            <a key={m.href} href={m.href} onClick={() => setOpen(false)}>{m.label}</a>
          ))}
        </nav>
        <a className="btn btn-zalo header-zalo" href={links.zalo} target="_blank" rel="noopener noreferrer">Nhắn Zalo</a>
        <button
          type="button"
          className="burger"
          aria-label="Mở menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  )
}
