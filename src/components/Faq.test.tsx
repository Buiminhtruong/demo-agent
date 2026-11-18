import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Faq from './Faq'
import { faqs } from '../data/site-data'

describe('Faq', () => {
  it('câu trả lời ẩn ban đầu, nút có aria-expanded=false', () => {
    const { container } = render(<Faq items={faqs} />)
    expect(container.querySelector('section#hoi-dap')).not.toBeNull()
    for (const f of faqs) {
      expect(screen.getByRole('button', { name: f.question })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(f.answer)).toBeNull()
    }
  })

  it('mở nhiều câu cùng lúc, bấm lại thì đóng đúng câu đó', async () => {
    render(<Faq items={faqs} />)
    const q1 = screen.getByRole('button', { name: faqs[0].question })
    const q2 = screen.getByRole('button', { name: faqs[1].question })

    await userEvent.click(q1)
    expect(q1).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(faqs[0].answer)).toBeInTheDocument()

    await userEvent.click(q2)
    expect(q1).toHaveAttribute('aria-expanded', 'true')
    expect(q2).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(faqs[0].answer)).toBeInTheDocument()
    expect(screen.getByText(faqs[1].answer)).toBeInTheDocument()

    await userEvent.click(q1)
    expect(q1).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(faqs[0].answer)).toBeNull()
    expect(q2).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(faqs[1].answer)).toBeInTheDocument()
  })
})
