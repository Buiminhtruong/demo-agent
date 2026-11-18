import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactFooter from './ContactFooter'
import { shop, contact } from '../data/site-data'

const links = { zalo: 'https://zalo.me/911111111', telegram: 'https://t.me/abc', phone: 'tel:0922222222' }

describe('ContactFooter', () => {
  it('có id lien-he và link Zalo/Telegram mở tab mới an toàn, href từ links', () => {
    const { container } = render(<ContactFooter shop={shop} contact={contact} links={links} />)
    expect(container.querySelector('#lien-he')).not.toBeNull()
    const zalo = screen.getByRole('link', { name: /Zalo/ })
    const tg = screen.getByRole('link', { name: /Telegram/ })
    expect(zalo).toHaveAttribute('href', links.zalo)
    expect(tg).toHaveAttribute('href', links.telegram)
    for (const a of [zalo, tg]) {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('link gọi điện là tel: và không có target', () => {
    render(<ContactFooter shop={shop} contact={contact} links={links} />)
    const phone = screen.getByRole('link', { name: /Gọi/ })
    expect(phone).toHaveAttribute('href', links.phone)
    expect(phone).not.toHaveAttribute('target')
  })

  it('hiện giờ hỗ trợ và dòng bản quyền có năm hiện tại + tên shop', () => {
    render(<ContactFooter shop={shop} contact={contact} links={links} />)
    expect(screen.getByText(shop.supportHours, { exact: false })).toBeInTheDocument()
    const year = String(new Date().getFullYear())
    expect(
      screen.getByText((_, el) => !!el && el.classList.contains('copy') && el.textContent!.includes(year) && el.textContent!.includes(shop.name)),
    ).toBeInTheDocument()
  })
})
