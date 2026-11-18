import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pricing from './Pricing'
import { proxyTypes } from '../data/site-data'
import { formatPrice } from '../lib/format-price'

const links = { zalo: 'https://zalo.me/900000000', telegram: 'https://t.me/x', phone: 'tel:0900' }

describe('Pricing', () => {
  it('có 3 tab, tab được chọn có aria-selected', () => {
    const { container } = render(<Pricing types={proxyTypes} selectedId="ipv6" onSelect={() => {}} links={links} />)
    expect(container.querySelector('section#bang-gia')).not.toBeNull()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(screen.getByRole('tab', { name: 'IPv6' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'IPv4 riêng' })).toHaveAttribute('aria-selected', 'false')
  })

  it('bấm tab gọi onSelect', async () => {
    const onSelect = vi.fn()
    render(<Pricing types={proxyTypes} selectedId="ipv4" onSelect={onSelect} links={links} />)
    await userEvent.click(screen.getByRole('tab', { name: 'IPv6' }))
    expect(onSelect).toHaveBeenCalledWith('ipv6')
  })

  it('hiện đúng 3 gói của loại đang chọn, mã, giá, nhãn Phổ biến', () => {
    render(<Pricing types={proxyTypes} selectedId="ipv4" onSelect={() => {}} links={links} />)
    const type = proxyTypes[0]
    expect(screen.getAllByRole('link', { name: 'Mua qua Zalo' })).toHaveLength(3)
    for (const p of type.plans) {
      expect(screen.getByText(p.code)).toBeInTheDocument()
      expect(screen.getByText(`Thời hạn: ${p.duration}`)).toBeInTheDocument()
      expect(screen.getByText(formatPrice(p.price), { exact: false })).toBeInTheDocument()
    }
    expect(screen.getByText('V4-30D')).toBeInTheDocument()
    expect(screen.queryByText('V6-30D')).toBeNull()
    expect(screen.getAllByText('Phổ biến')).toHaveLength(1)
  })

  it('nút Zalo và Telegram lấy từ links, mở tab mới an toàn', () => {
    render(<Pricing types={proxyTypes} selectedId="ipv4" onSelect={() => {}} links={links} />)
    const zalos = screen.getAllByRole('link', { name: 'Mua qua Zalo' })
    const tgs = screen.getAllByRole('link', { name: /Telegram/ })
    expect(tgs).toHaveLength(3)
    for (const a of zalos) expect(a).toHaveAttribute('href', links.zalo)
    for (const a of tgs) expect(a).toHaveAttribute('href', links.telegram)
    for (const a of [...zalos, ...tgs]) {
      expect(a).toHaveAttribute('target', '_blank')
      expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('mỗi gói có nút Copy tin nhắn mẫu; bấm thì chép đúng câu của gói và báo đã chép', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    render(<Pricing types={proxyTypes} selectedId="ipv4" onSelect={() => {}} links={links} />)
    const buttons = screen.getAllByRole('button', { name: /Copy tin nhắn mẫu/ })
    expect(buttons).toHaveLength(3)
    await user.click(buttons[2])
    expect(writeText).toHaveBeenCalledWith(
      'Chào shop, mình muốn mua gói V4-30D (IPv4 riêng – Gói 30 ngày, 120.000đ/IP). Số lượng: ... IP',
    )
    expect(await screen.findByRole('button', { name: /Đã chép/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Copy tin nhắn mẫu/ })).toHaveLength(2)
  })

  it('chép thất bại thì báo khách gõ mã gói', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    document.execCommand = vi.fn().mockReturnValue(false)
    render(<Pricing types={proxyTypes} selectedId="ipv4" onSelect={() => {}} links={links} />)
    await user.click(screen.getAllByRole('button', { name: /Copy tin nhắn mẫu/ })[0])
    expect(await screen.findByRole('button', { name: /Không chép được.*V4-1D/ })).toBeInTheDocument()
  })

  it('có dòng nhắc gửi mã gói', () => {
    render(<Pricing types={proxyTypes} selectedId="ipv4" onSelect={() => {}} links={links} />)
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Khi nhắn, gửi kèm mã gói để được xử lý nhanh.'),
    ).toBeInTheDocument()
  })
})
