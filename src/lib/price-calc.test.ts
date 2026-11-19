import { describe, it, expect } from 'vitest'
import { MAX_QUANTITY, parseQuantity, quoteMessage } from './price-calc'
import { calcMessageTemplate, proxyTypes } from '../data/site-data'

describe('parseQuantity', () => {
  it('nhận số nguyên từ 1 đến 1000', () => {
    expect(parseQuantity('1')).toBe(1)
    expect(parseQuantity(' 10 ')).toBe(10)
    expect(parseQuantity(String(MAX_QUANTITY))).toBe(1000)
  })

  it('trả null khi rỗng, 0, âm, thập phân, chữ hoặc quá 1000', () => {
    for (const bad of ['', '   ', '0', '-3', '2.5', '1e3', 'abc', '1001', '99999999999999999999']) {
      expect(parseQuantity(bad)).toBeNull()
    }
  })
})

describe('quoteMessage', () => {
  const type = proxyTypes[0]
  const plan = type.plans[2]

  it('điền mã gói, loại, tên gói, số lượng và tổng tiền', () => {
    expect(quoteMessage('{code}|{type}|{plan}|{price}|{qty}|{total}', type, plan, 10)).toBe(
      'V4-30D|IPv4 riêng|Gói 30 ngày|120.000đ|10|1.200.000đ',
    )
  })

  it('câu mẫu mặc định', () => {
    expect(quoteMessage(calcMessageTemplate, type, plan, 10)).toBe(
      'Chào shop, mình muốn mua gói V4-30D (IPv4 riêng – Gói 30 ngày), số lượng: 10 IP, tổng 1.200.000đ.',
    )
  })
})
