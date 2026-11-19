import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromoBanner from './PromoBanner'
import type { Promo } from '../data/site-data'

const promo: Promo = { message: '🔥 Giảm 10% mọi gói 30 ngày', code: 'PROXY10', endsAt: '2026-11-26T23:59:59+07:00' }
const START = new Date('2026-11-24T09:54:26+07:00') // còn 2 ngày 14:05:33

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(START)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('PromoBanner', () => {
  it('hiện nội dung, mã và đếm ngược 2 chữ số', () => {
    render(<PromoBanner promo={promo} />)
    expect(screen.getByRole('region', { name: 'Khuyến mãi' })).toBeInTheDocument()
    expect(screen.getByText(promo.message)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /PROXY10/ })).toBeInTheDocument()
    expect(screen.getByText(/Còn/)).toHaveTextContent('Còn 02 ngày 14:05:3')
  })

  it('đếm ngược chạy mỗi giây', () => {
    render(<PromoBanner promo={promo} />)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText(/Còn/)).toHaveTextContent('14:05:2')
  })

  it('không hiện khi promo null hoặc đã hết hạn', () => {
    const { container, rerender } = render(<PromoBanner promo={null} />)
    expect(container).toBeEmptyDOMElement()
    vi.setSystemTime(new Date('2026-11-27T00:00:00+07:00'))
    rerender(<PromoBanner promo={promo} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('tự biến mất khi hết hạn lúc đang mở, và dừng timer khi unmount', () => {
    vi.setSystemTime(new Date('2026-11-26T23:59:57+07:00'))
    const { container, unmount } = render(<PromoBanner promo={promo} />)
    expect(screen.getByRole('region')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(container).toBeEmptyDOMElement()
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('bấm mã thì chép mã, hiện "Đã chép" rồi về lại sau 3 giây', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    render(<PromoBanner promo={promo} />)
    await user.click(screen.getByRole('button', { name: /PROXY10/ }))
    expect(writeText).toHaveBeenCalledWith('PROXY10')
    expect(await screen.findByRole('button', { name: /Đã chép/ })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3100) })
    expect(screen.getByRole('button', { name: /Chép/ })).toHaveTextContent('PROXY10')
  })

  it('chép lỗi thì báo "Không chép được"', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('x'))
    document.execCommand = vi.fn().mockReturnValue(false)
    render(<PromoBanner promo={promo} />)
    await user.click(screen.getByRole('button', { name: /PROXY10/ }))
    expect(await screen.findByRole('button', { name: /Không chép được/ })).toBeInTheDocument()
  })

  it('bấm × ẩn banner và lưu mã đã đóng', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { container } = render(<PromoBanner promo={promo} />)
    await user.click(screen.getByRole('button', { name: 'Đóng khuyến mãi' }))
    expect(container).toBeEmptyDOMElement()
    expect(localStorage.getItem('promo-dismissed')).toBe('PROXY10')
  })

  it('đã đóng mã này từ trước thì không hiện; mã mới thì hiện lại', () => {
    localStorage.setItem('promo-dismissed', 'PROXY10')
    const { container, unmount } = render(<PromoBanner promo={promo} />)
    expect(container).toBeEmptyDOMElement()
    unmount()
    render(<PromoBanner promo={{ ...promo, code: 'NEW20' }} />)
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  it('localStorage lỗi thì vẫn hiện và đóng được', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const { container } = render(<PromoBanner promo={promo} />)
    expect(screen.getByRole('region')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đóng khuyến mãi' }))
    expect(container).toBeEmptyDOMElement()
  })
})
