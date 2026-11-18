import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'
import { shop } from '../data/site-data'

const links = { zalo: 'https://zalo.me/900000000', telegram: 'https://t.me/x', phone: 'tel:0900' }

describe('Hero', () => {
  it('hiện tiêu đề và 3 điểm mạnh', () => {
    render(<Hero shop={shop} links={links} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(shop.tagline)
    for (const h of shop.highlights) expect(screen.getByText(h, { exact: false })).toBeInTheDocument()
    expect(shop.highlights).toHaveLength(3)
    expect(screen.getByText(shop.description)).toBeInTheDocument()
  })

  it('nút Zalo và Telegram đúng href', () => {
    render(<Hero shop={shop} links={links} />)
    const zalo = screen.getByRole('link', { name: 'Nhắn Zalo' })
    const tg = screen.getByRole('link', { name: 'Nhắn Telegram' })
    expect(zalo).toHaveAttribute('href', links.zalo)
    expect(tg).toHaveAttribute('href', links.telegram)
    for (const a of [zalo, tg]) {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })
})
