import { describe, it, expect } from 'vitest'
import { isPromoActive, timeLeft, withPromoCode } from './promo'
import type { Promo } from '../data/site-data'

const promo: Promo = { message: 'Giảm 10%', code: 'PROXY10', endsAt: '2026-11-26T23:59:59+07:00' }
const before = new Date('2026-11-20T00:00:00+07:00')
const end = new Date('2026-11-26T23:59:59+07:00')

describe('isPromoActive', () => {
  it('true khi còn hạn', () => expect(isPromoActive(promo, before)).toBe(true))
  it('false khi promo null', () => expect(isPromoActive(null, before)).toBe(false))
  it('false khi thiếu mã hoặc nội dung', () => {
    expect(isPromoActive({ ...promo, code: '' }, before)).toBe(false)
    expect(isPromoActive({ ...promo, message: '' }, before)).toBe(false)
  })
  it('false khi endsAt không hợp lệ', () => expect(isPromoActive({ ...promo, endsAt: 'abc' }, before)).toBe(false))
  it('false đúng lúc hết hạn và sau đó', () => {
    expect(isPromoActive(promo, end)).toBe(false)
    expect(isPromoActive(promo, new Date(end.getTime() + 1000))).toBe(false)
  })
  it('còn 1 giây thì vẫn active', () => expect(isPromoActive(promo, new Date(end.getTime() - 1000))).toBe(true))
})

describe('timeLeft', () => {
  it('tách ngày, giờ, phút, giây', () => {
    const now = new Date(end.getTime() - ((2 * 24 + 14) * 3600 + 5 * 60 + 33) * 1000)
    expect(timeLeft(promo.endsAt, now)).toEqual({ days: 2, hours: 14, minutes: 5, seconds: 33 })
  })
  it('null khi hết hạn hoặc không hợp lệ', () => {
    expect(timeLeft(promo.endsAt, end)).toBeNull()
    expect(timeLeft('abc', before)).toBeNull()
  })
})

describe('withPromoCode', () => {
  it('thêm mã khi đang khuyến mãi', () => expect(withPromoCode('Chào shop.', promo, before)).toBe('Chào shop. Mã: PROXY10'))
  it('giữ nguyên khi null hoặc hết hạn', () => {
    expect(withPromoCode('Chào shop.', null, before)).toBe('Chào shop.')
    expect(withPromoCode('Chào shop.', promo, end)).toBe('Chào shop.')
  })
})
