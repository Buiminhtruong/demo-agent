import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PriceCalculator from './PriceCalculator'
import { proxyTypes } from '../data/site-data'

const links = { zalo: 'https://zalo.me/900000000', telegram: 'https://t.me/x', phone: 'tel:0900' }

function setup(selectedId = 'ipv4', onSelect = vi.fn()) {
  const utils = render(<PriceCalculator types={proxyTypes} selectedId={selectedId} onSelect={onSelect} links={links} />)
  return { ...utils, onSelect }
}

const total = () => screen.getByTestId('calc-total')

describe('PriceCalculator', () => {
  it('mặc định chọn gói phổ biến, số lượng 1, hiện tổng tiền', () => {
    setup()
    expect(screen.getByLabelText('Loại proxy')).toHaveValue('ipv4')
    expect(screen.getByLabelText('Thời hạn')).toHaveValue('V4-30D')
    expect(screen.getByLabelText(/Số lượng IP/)).toHaveValue(1)
    expect(total()).toHaveTextContent('120.000đ')
    expect(screen.getByText('Gói V4-30D · 120.000đ × 1 IP')).toBeInTheDocument()
  })

  it('nhập số lượng thì tổng tiền cập nhật ngay', async () => {
    const user = userEvent.setup()
    setup()
    const qty = screen.getByLabelText(/Số lượng IP/)
    await user.clear(qty)
    await user.type(qty, '10')
    expect(total()).toHaveTextContent('1.200.000đ')
    expect(screen.getByText('Gói V4-30D · 120.000đ × 10 IP')).toBeInTheDocument()
  })

  it('đổi thời hạn thì dùng giá của gói đó', async () => {
    const user = userEvent.setup()
    setup()
    await user.selectOptions(screen.getByLabelText('Thời hạn'), 'V4-7D')
    expect(total()).toHaveTextContent('50.000đ')
  })

  it('chọn loại proxy gọi onSelect (đồng bộ với tab bảng giá)', async () => {
    const user = userEvent.setup()
    const { onSelect } = setup()
    await user.selectOptions(screen.getByLabelText('Loại proxy'), 'ipv6')
    expect(onSelect).toHaveBeenCalledWith('ipv6')
  })

  it('đổi loại từ ngoài (tab) thì giữ cùng thời hạn và tính theo giá loại mới', async () => {
    const user = userEvent.setup()
    const { rerender } = setup()
    await user.selectOptions(screen.getByLabelText('Thời hạn'), 'V4-7D')
    rerender(<PriceCalculator types={proxyTypes} selectedId="ipv6" onSelect={() => {}} links={links} />)
    expect(screen.getByLabelText('Loại proxy')).toHaveValue('ipv6')
    expect(screen.getByLabelText('Thời hạn')).toHaveValue('V6-7D')
    expect(total()).toHaveTextContent('15.000đ')
  })

  it('số lượng không hợp lệ thì báo nhẹ, không tính, khoá nút copy', async () => {
    const user = userEvent.setup()
    setup()
    const qty = screen.getByLabelText(/Số lượng IP/)
    await user.clear(qty)
    await user.type(qty, '1001')
    expect(screen.getByRole('alert')).toHaveTextContent('Nhập số lượng từ 1 đến 1000')
    expect(total()).toHaveTextContent('—')
    expect(screen.getByRole('button', { name: /Copy tin nhắn/ })).toBeDisabled()
    await user.clear(qty)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('nút Mua qua Zalo lấy link Zalo, mở tab mới an toàn', () => {
    setup()
    const zalo = screen.getByRole('link', { name: 'Mua qua Zalo' })
    expect(zalo).toHaveAttribute('href', links.zalo)
    expect(zalo).toHaveAttribute('target', '_blank')
    expect(zalo).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('bấm Copy tin nhắn chép câu có mã gói, số lượng, tổng tiền', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    setup()
    const qty = screen.getByLabelText(/Số lượng IP/)
    await user.clear(qty)
    await user.type(qty, '10')
    await user.click(screen.getByRole('button', { name: /Copy tin nhắn/ }))
    expect(writeText).toHaveBeenCalledWith(
      'Chào shop, mình muốn mua gói V4-30D (IPv4 riêng – Gói 30 ngày), số lượng: 10 IP, tổng 1.200.000đ.',
    )
    expect(await screen.findByRole('button', { name: /Đã chép/ })).toBeInTheDocument()
  })
})
