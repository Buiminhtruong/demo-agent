import type { Plan, ProxyType } from '../data/site-data'
import { formatPrice } from './format-price'

// Điền {code} {type} {plan} {price} trong câu mẫu bằng thông tin của gói
export function orderMessage(template: string, type: ProxyType, plan: Plan): string {
  const values: Record<string, string> = {
    code: plan.code,
    type: type.name,
    plan: plan.name,
    price: formatPrice(plan.price),
  }
  return template.replace(/\{(code|type|plan|price)\}/g, (_, key: string) => values[key])
}
