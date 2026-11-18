import type { ProxyType } from '../data/site-data'

export function minPrice(type: ProxyType): number {
  return Math.min(...type.plans.map((p) => p.price))
}