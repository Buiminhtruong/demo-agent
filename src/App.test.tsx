import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  const scrollIntoView = vi.fn()
  beforeEach(() => {
    scrollIntoView.mockClear()
    Element.prototype.scrollIntoView = scrollIntoView
  })

  it('banner khuyến mãi nằm trên Header khi mã mẫu còn hạn (giờ được cố định)', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-11-20T00:00:00+07:00'))
    try {
      localStorage.clear()
      const { container } = render(<App />)
      const banner = screen.getByRole('region', { name: 'Khuyến mãi' })
      const header = container.querySelector('header') as HTMLElement
      expect(banner).toHaveTextContent('PROXY10')
      expect(banner.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('mặc định hiện gói của loại đầu tiên', () => {
    render(<App />)
    expect(screen.getByText('V4-30D')).toBeInTheDocument()
  })

  it('bấm tab IPv6 đổi sang gói IPv6', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'IPv6' }))
    expect(screen.getByText('V6-30D')).toBeInTheDocument()
    expect(screen.queryByText('V4-30D')).toBeNull()
  })

  it('bấm thẻ loại thứ 3 chọn tab và cuộn tới bảng giá', async () => {
    const { container } = render(<App />)
    const section = container.querySelector('#loai-proxy') as HTMLElement
    await userEvent.click(within(section).getByRole('button', { name: /Proxy dân cư xoay/ }))
    expect(screen.getByRole('tab', { name: 'Proxy dân cư xoay' })).toHaveAttribute('aria-selected', 'true')
    expect(scrollIntoView).toHaveBeenCalled()
    const target = scrollIntoView.mock.contexts[0] as HTMLElement
    expect(target.id).toBe('bang-gia')
  })

  it('bấm "Xem giá IPv6" ở bảng so sánh chọn tab IPv6 và cuộn tới bảng giá', async () => {
    const { container } = render(<App />)
    const section = container.querySelector('#so-sanh') as HTMLElement
    await userEvent.click(within(section).getAllByRole('button', { name: 'Xem giá IPv6' })[0])
    expect(screen.getByRole('tab', { name: 'IPv6' })).toHaveAttribute('aria-selected', 'true')
    const target = scrollIntoView.mock.contexts[0] as HTMLElement
    expect(target.id).toBe('bang-gia')
  })

  it('ô tính giá nằm trong Bảng giá, sau các gói, và đi theo tab đang chọn', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const section = container.querySelector('#bang-gia') as HTMLElement
    const calc = section.querySelector('#tinh-gia') as HTMLElement
    expect(calc).not.toBeNull()
    expect(section.querySelector('#plan-panel')!.compareDocumentPosition(calc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'IPv6' }))
    expect(within(calc).getByLabelText('Loại proxy')).toHaveValue('ipv6')
    await user.selectOptions(within(calc).getByLabelText('Loại proxy'), 'residential')
    expect(screen.getByRole('tab', { name: 'Proxy dân cư xoay' })).toHaveAttribute('aria-selected', 'true')
  })

  it('các phần mới nằm đúng thứ tự trên trang', () => {
    const { container } = render(<App />)
    const ids = Array.from(container.querySelectorAll('main > section')).map((s) => s.id)
    expect(ids.indexOf('so-sanh')).toBe(ids.indexOf('loai-proxy') + 1)
    expect(ids.indexOf('bang-gia')).toBe(ids.indexOf('so-sanh') + 1)
    expect(ids.indexOf('danh-gia')).toBe(ids.indexOf('bang-gia') + 1)
    expect(ids.indexOf('cach-mua')).toBe(ids.indexOf('danh-gia') + 1)
  })
})
