import { describe, expect, it } from 'vitest'
import { minPrice } from './min-price'
import type { Plan, ProxyType } from '../data/site-data'

const p: Plan = { code: 'X-1D', name: 'Gói', duration: '1 ngày', price: 1, features: [] }
const type: ProxyType = { id: 'x', name: 'X', description: '', useCases: '', plans: [] }

describe('minPrice', () => {
  it('trả về giá thấp nhất dù gói không theo thứ tự giá', () => {
    expect(
      minPrice({
        ...type,
        plans: [
          { ...p, price: 300000 },
          { ...p, price: 20000 },
          { ...p, price: 90000 },
        ],
      }),
    ).toBe(20000)
  })
})