import { describe, expect, it } from 'vitest'
import { proxyTypes, shop } from './site-data'

describe('site-data', () => {
  it('có 3 loại proxy, mỗi loại 3 gói', () => {
    expect(proxyTypes).toHaveLength(3)
    for (const t of proxyTypes) expect(t.plans).toHaveLength(3)
  })

  it('mã gói duy nhất trên toàn bộ', () => {
    const codes = proxyTypes.flatMap((t) => t.plans.map((p) => p.code))
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('mỗi loại có đúng 1 gói popular và đó là gói 30 ngày', () => {
    for (const t of proxyTypes) {
      const popular = t.plans.filter((p) => p.popular)
      expect(popular).toHaveLength(1)
      expect(popular[0].code.endsWith('-30D')).toBe(true)
    }
  })

  it('shop có mô tả không rỗng', () => {
    expect(shop.description.length).toBeGreaterThan(0)
  })
})
