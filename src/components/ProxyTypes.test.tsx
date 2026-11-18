import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProxyTypes from './ProxyTypes'
import { proxyTypes } from '../data/site-data'
import { formatPrice } from '../lib/format-price'
import { minPrice } from '../lib/min-price'

describe('ProxyTypes', () => {
  it('hiện 3 thẻ, mỗi thẻ có giá từ', () => {
    const { container } = render(<ProxyTypes types={proxyTypes} onSelect={() => {}} />)
    expect(container.querySelector('section#loai-proxy')).not.toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(3)
    for (const t of proxyTypes) {
      expect(screen.getByText(t.name)).toBeInTheDocument()
      expect(screen.getByText(`từ ${formatPrice(minPrice(t))}`, { exact: false })).toBeInTheDocument()
    }
  })

  it('bấm thẻ gọi onSelect với id loại', async () => {
    const onSelect = vi.fn()
    render(<ProxyTypes types={proxyTypes} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(proxyTypes[1].name) }))
    expect(onSelect).toHaveBeenCalledWith(proxyTypes[1].id)
  })

  it('loại không có gói thì không hiện dòng "từ"', () => {
    const empty = [{ ...proxyTypes[0], plans: [] }]
    render(<ProxyTypes types={empty} onSelect={() => {}} />)
    expect(screen.getByText(empty[0].name)).toBeInTheDocument()
    expect(screen.queryByText(/từ/)).toBeNull()
    expect(screen.queryByText(/Infinity/)).toBeNull()
  })
})
