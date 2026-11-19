import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanAdvisor from './PlanAdvisor'
import { proxyTypes, planAdvisor } from '../data/site-data'

function setup(onApply = vi.fn()) {
  render(<PlanAdvisor types={proxyTypes} config={planAdvisor} onApply={onApply} />)
  return { onApply }
}

const pick = (name: RegExp) => screen.getByRole('button', { name })

describe('PlanAdvisor', () => {
  it('hiện tiêu đề, 2 câu hỏi và các lựa chọn, chưa hiện gợi ý', () => {
    setup()
    expect(screen.getByRole('heading', { name: '🧭 Chưa biết chọn gói nào?' })).toBeInTheDocument()
    expect(screen.getByText('Bạn dùng proxy để làm gì?')).toBeInTheDocument()
    expect(screen.getByText('Bạn cần dùng trong bao lâu?')).toBeInTheDocument()
    expect(pick(/Nuôi tài khoản, chạy quảng cáo/)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('Gợi ý cho bạn')).toBeNull()
  })

  it('mới trả lời một câu thì chưa hiện gợi ý', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(pick(/Thu thập dữ liệu/))
    expect(pick(/Thu thập dữ liệu/)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Gợi ý cho bạn')).toBeNull()
  })

  it('trả lời đủ 2 câu thì hiện gợi ý đúng gói, giá và lý do', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(pick(/Thu thập dữ liệu/))
    await user.click(pick(/Khoảng 1 tuần/))
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument()
    expect(screen.getByText('Proxy dân cư xoay – Gói 7 ngày')).toBeInTheDocument()
    expect(screen.getByText('RES-7D')).toBeInTheDocument()
    expect(screen.getByText(/250\.000đ/)).toBeInTheDocument()
    expect(screen.getByText(/\/ 1 IP/)).toBeInTheDocument()
    expect(screen.getByText(/IP nhà mạng thật, tự đổi theo thời gian/)).toBeInTheDocument()
  })

  it('"Chưa rõ" gợi ý IPv4 riêng', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(pick(/Chưa rõ/))
    await user.click(pick(/Dùng thử 1 ngày/))
    expect(screen.getByText('IPv4 riêng – Gói 1 ngày')).toBeInTheDocument()
  })

  it('bấm "Tính tiền với gói này" gọi onApply với loại và thời hạn', async () => {
    const user = userEvent.setup()
    const { onApply } = setup()
    await user.click(pick(/Chạy tool số lượng lớn/))
    await user.click(pick(/1 tháng trở lên/))
    await user.click(pick(/Tính tiền với gói này/))
    expect(onApply).toHaveBeenCalledWith('ipv6', '30 ngày')
  })

  it('"Chọn lại" xoá cả hai câu trả lời và ẩn gợi ý', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(pick(/Thu thập dữ liệu/))
    await user.click(pick(/Khoảng 1 tuần/))
    await user.click(pick(/Chọn lại/))
    expect(screen.queryByText('Gợi ý cho bạn')).toBeNull()
    expect(pick(/Thu thập dữ liệu/)).toHaveAttribute('aria-pressed', 'false')
    expect(pick(/Khoảng 1 tuần/)).toHaveAttribute('aria-pressed', 'false')
  })

  it('vùng gợi ý có aria-live="polite"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(pick(/Thu thập dữ liệu/))
    await user.click(pick(/Khoảng 1 tuần/))
    expect(screen.getByText('Gợi ý cho bạn').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })
})
