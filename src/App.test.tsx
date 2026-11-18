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
})
