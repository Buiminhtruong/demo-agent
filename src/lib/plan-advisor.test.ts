import { describe, it, expect } from 'vitest'
import { recommendPlan } from './plan-advisor'
import { proxyTypes } from '../data/site-data'

describe('recommendPlan', () => {
  it('trả về loại và gói đúng theo thời hạn', () => {
    const r = recommendPlan(proxyTypes, 'residential', '7 ngày')
    expect(r?.type.id).toBe('residential')
    expect(r?.plan.code).toBe('RES-7D')
  })

  it('không có thời hạn thì dùng gói phổ biến của loại đó', () => {
    expect(recommendPlan(proxyTypes, 'ipv4', undefined)?.plan.code).toBe('V4-30D')
  })

  it('thời hạn không tồn tại ở loại đó thì dùng gói phổ biến', () => {
    expect(recommendPlan(proxyTypes, 'ipv6', '365 ngày')?.plan.code).toBe('V6-30D')
  })

  it('loại không tồn tại hoặc thiếu thì trả về null', () => {
    expect(recommendPlan(proxyTypes, 'khong-co', '1 ngày')).toBeNull()
    expect(recommendPlan(proxyTypes, undefined, '1 ngày')).toBeNull()
  })

  it('loại không có gói nào thì trả về null', () => {
    const empty = [{ ...proxyTypes[0], plans: [] }]
    expect(recommendPlan(empty, 'ipv4', '1 ngày')).toBeNull()
  })
})
