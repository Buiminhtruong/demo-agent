import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FloatingContact from './FloatingContact'

describe('FloatingContact', () => {
  it('link Zalo đúng href', () => {
    render(<FloatingContact zaloUrl="https://zalo.me/1" />)
    const a = screen.getByRole('link', { name: 'Nhắn Zalo' })
    expect(a).toHaveAttribute('href', 'https://zalo.me/1')
    expect(a).toHaveAttribute('target', '_blank')
  })
})
