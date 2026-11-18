import { describe, expect, it } from 'vitest'
import { formatPrice } from './format-price'

describe('formatPrice', () => {
  it('định dạng nghìn bằng dấu chấm và thêm đ', () => {
    expect(formatPrice(120000)).toBe('120.000đ')
    expect(formatPrice(5000)).toBe('5.000đ')
    expect(formatPrice(1250000)).toBe('1.250.000đ')
  })
})