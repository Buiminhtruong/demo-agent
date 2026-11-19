import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Reviews from './Reviews'
import { proxyTypes, type Review } from '../data/site-data'

const items: Review[] = [
  { name: 'Minh T.', rating: 5, text: 'Chạy ổn định cả tháng.', proxyTypeId: 'ipv4' },
  { name: 'Ngọc A.', rating: 4, text: 'Ít bị chặn.', proxyTypeId: 'residential' },
]

describe('Reviews', () => {
  it('hiện tên, chữ viết tắt, lời nhận xét và loại proxy đã dùng', () => {
    const { container } = render(<Reviews items={items} types={proxyTypes} sample={false} />)
    expect(container.querySelector('section#danh-gia')).not.toBeNull()
    expect(screen.getByText('Minh T.')).toBeInTheDocument()
    expect(screen.getByText('MT')).toBeInTheDocument()
    expect(screen.getByText(/Chạy ổn định cả tháng/)).toBeInTheDocument()
    expect(screen.getByText('Dùng IPv4 riêng')).toBeInTheDocument()
    expect(screen.getByText('Dùng Proxy dân cư xoay')).toBeInTheDocument()
  })

  it('số sao có nhãn đọc được và đúng số sao đầy', () => {
    render(<Reviews items={items} types={proxyTypes} sample={false} />)
    expect(screen.getByLabelText('5 trên 5 sao')).toHaveTextContent('★★★★★')
    expect(screen.getByLabelText('4 trên 5 sao')).toHaveTextContent('★★★★☆')
  })

  it('số sao lẻ hoặc ngoài 1–5 được làm tròn và kẹp, không lỗi', () => {
    const odd: Review[] = [
      { ...items[0], rating: 4.6 },
      { ...items[1], rating: 9 },
      { ...items[1], text: 'x', rating: -2 },
    ]
    render(<Reviews items={odd} types={proxyTypes} sample={false} />)
    expect(screen.getAllByLabelText('5 trên 5 sao')).toHaveLength(2)
    expect(screen.getByLabelText('0 trên 5 sao')).toHaveTextContent('☆☆☆☆☆')
  })

  it('dữ liệu mẫu thì hiện dòng báo, dữ liệu thật thì không', () => {
    const { rerender } = render(<Reviews items={items} types={proxyTypes} sample={true} />)
    expect(screen.getByText('Nội dung đánh giá đang là dữ liệu mẫu.')).toBeInTheDocument()
    rerender(<Reviews items={items} types={proxyTypes} sample={false} />)
    expect(screen.queryByText('Nội dung đánh giá đang là dữ liệu mẫu.')).toBeNull()
  })

  it('loại proxy không tồn tại thì không hiện dòng "Dùng ..."', () => {
    render(<Reviews items={[{ ...items[0], proxyTypeId: 'khong-co' }]} types={proxyTypes} sample={false} />)
    expect(screen.queryByText(/^Dùng /)).toBeNull()
  })
})
