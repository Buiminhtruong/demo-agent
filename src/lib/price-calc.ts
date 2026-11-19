import type { Plan, ProxyType } from '../data/site-data'
import { formatPrice } from './format-price'
import { orderMessage } from './order-message'

export const MAX_QUANTITY = 1000

// Số lượng IP khách gõ: chỉ nhận số nguyên 1..MAX_QUANTITY, còn lại trả null
export function parseQuantity(input: string): number | null {
  const text = input.trim()
  if (!/^\d+$/.test(text)) return null
  const n = Number(text)
  return n >= 1 && n <= MAX_QUANTITY ? n : null
}

// Câu chép cho ô tính giá: như câu mẫu của gói, thêm {qty} = số lượng, {total} = tổng tiền
export function quoteMessage(template: string, type: ProxyType, plan: Plan, qty: number): string {
  return orderMessage(template, type, plan)
    .replace(/\{qty\}/g, String(qty))
    .replace(/\{total\}/g, formatPrice(plan.price * qty))
}
