import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Compare from './Compare'
import { proxyTypes } from '../data/site-data'
import { formatPrice } from '../lib/format-price'
import { minPrice } from '../lib/min-price'

describe('Compare', () => {
  it('bảng có cột cho từng loại và giá từ tính từ bảng giá', () => {
    const { container } = render(<Compare types={proxyTypes} onSelect={() => {}} />)
    expect(container.querySelector('section#so-sanh')).not.toBeNull()
    const table = screen.getByRole('table')
    for (const t of proxyTypes) {
      expect(within(table).getByRole('columnheader', { name: t.name })).toBeInTheDocument()
      expect(within(table).getByText(formatPrice(minPrice(t)))).toBeInTheDocument()
    }
    // mỗi dòng: ô thứ i là của loại thứ i
    const ipRow = within(table).getByRole('rowheader', { name: 'IP' }).closest('tr') as HTMLElement
    const stabRow = within(table).getByRole('rowheader', { name: 'Độ ổn định' }).closest('tr') as HTMLElement
    const supRow = within(table).getByRole('rowheader', { name: 'Trang web hỗ trợ' }).closest('tr') as HTMLElement
    proxyTypes.forEach((t, i) => {
      expect(ipRow.querySelectorAll('td')[i]).toHaveTextContent(t.compare.ip)
      expect(stabRow.querySelectorAll('td')[i]).toHaveTextContent(t.compare.stability.text)
      expect(supRow.querySelectorAll('td')[i]).toHaveTextContent(t.compare.support.text)
    })
  })

  it('có các dòng tiêu chí', () => {
    render(<Compare types={proxyTypes} onSelect={() => {}} />)
    const table = screen.getByRole('table')
    for (const label of ['Giá từ', 'IP', 'Độ ổn định', 'Trang web hỗ trợ', 'Hợp với']) {
      expect(within(table).getByRole('rowheader', { name: label })).toBeInTheDocument()
    }
  })

  it('điện thoại: mỗi loại một thẻ có đủ thông tin', () => {
    const { container } = render(<Compare types={proxyTypes} onSelect={() => {}} />)
    const cards = container.querySelectorAll('.cmp-card')
    expect(cards).toHaveLength(proxyTypes.length)
    proxyTypes.forEach((t, i) => {
      const card = cards[i] as HTMLElement
      expect(within(card).getByText(t.name)).toBeInTheDocument()
      expect(within(card).getByText(formatPrice(minPrice(t)))).toBeInTheDocument()
      expect(within(card).getByText(t.compare.ip)).toBeInTheDocument()
    })
  })

  it('bấm "Xem giá" gọi onSelect với đúng loại (cả bảng và thẻ)', async () => {
    const onSelect = vi.fn()
    render(<Compare types={proxyTypes} onSelect={onSelect} />)
    const buttons = screen.getAllByRole('button', { name: `Xem giá ${proxyTypes[1].name}` })
    expect(buttons).toHaveLength(2)
    await userEvent.click(buttons[0])
    await userEvent.click(buttons[1])
    expect(onSelect).toHaveBeenNthCalledWith(1, proxyTypes[1].id)
    expect(onSelect).toHaveBeenNthCalledWith(2, proxyTypes[1].id)
  })

  it('loại không có gói thì giá từ hiện dấu gạch, không ra Infinity', () => {
    const types = [{ ...proxyTypes[0], plans: [] }]
    render(<Compare types={types} onSelect={() => {}} />)
    expect(screen.queryByText(/Infinity/)).toBeNull()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
