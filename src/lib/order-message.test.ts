import { describe, it, expect } from 'vitest'
import { orderMessage } from './order-message'
import { orderMessageTemplate, proxyTypes } from '../data/site-data'

describe('orderMessage', () => {
  const type = proxyTypes[0]
  const plan = type.plans[2]

  it('điền mã gói, loại, tên gói và giá vào câu mẫu', () => {
    expect(orderMessage('{code}|{type}|{plan}|{price}', type, plan)).toBe('V4-30D|IPv4 riêng|Gói 30 ngày|120.000đ')
  })

  it('thay mọi chỗ trùng, giữ nguyên phần chữ khác', () => {
    expect(orderMessage('Gói {code} — mã {code}.', type, plan)).toBe('Gói V4-30D — mã V4-30D.')
  })

  it('câu mẫu mặc định chứa mã gói và giá', () => {
    const msg = orderMessage(orderMessageTemplate, type, plan)
    expect(msg).toBe('Chào shop, mình muốn mua gói V4-30D (IPv4 riêng – Gói 30 ngày, 120.000đ/IP). Số lượng: ... IP')
  })
})
