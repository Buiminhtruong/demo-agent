import type { Plan, ProxyType } from '../data/site-data'

export type Recommendation = { type: ProxyType; plan: Plan }

// Gợi ý gói từ loại proxy + thời hạn khách chọn.
// Thiếu thời hạn hoặc loại đó không có thời hạn này → dùng gói phổ biến; không có loại → null.
export function recommendPlan(
  types: ProxyType[],
  typeId: string | undefined,
  duration: string | undefined,
): Recommendation | null {
  const type = types.find((t) => t.id === typeId)
  if (!type) return null
  const plan =
    (duration !== undefined ? type.plans.find((p) => p.duration === duration) : undefined) ??
    type.plans.find((p) => p.popular) ??
    type.plans[0]
  return plan ? { type, plan } : null
}
