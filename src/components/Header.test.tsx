import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from './Header'

const links = { zalo: 'https://zalo.me/900000000', telegram: 'https://t.me/x', phone: 'tel:0900' }

describe('Header', () => {
  it('có 5 link menu', () => {
    render(<Header shopName="ProxyViet" links={links} />)
    const hrefs = ['#loai-proxy', '#bang-gia', '#cach-mua', '#hoi-dap', '#lien-he']
    for (const h of hrefs) {
      expect(document.querySelector(`nav a[href="${h}"]`)).not.toBeNull()
    }
    expect(document.querySelectorAll('nav a')).toHaveLength(5)
  })

  it('nút Nhắn Zalo đúng link', () => {
    render(<Header shopName="ProxyViet" links={links} />)
    const a = screen.getByRole('link', { name: 'Nhắn Zalo' })
    expect(a).toHaveAttribute('href', links.zalo)
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('mở và đóng menu mobile', async () => {
    const user = userEvent.setup()
    render(<Header shopName="ProxyViet" links={links} />)
    const btn = screen.getByRole('button', { name: 'Mở menu' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    await user.click(document.querySelector('nav a[href="#bang-gia"]') as HTMLElement)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
})
