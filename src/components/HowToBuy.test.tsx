import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HowToBuy from './HowToBuy'

describe('HowToBuy', () => {
  it('có 3 bước đúng thứ tự', () => {
    const { container } = render(<HowToBuy />)
    expect(container.querySelector('section#cach-mua')).not.toBeNull()
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['Chọn gói', 'Nhắn Zalo/Telegram kèm mã gói', 'Chuyển khoản, nhận proxy'])
  })
})
