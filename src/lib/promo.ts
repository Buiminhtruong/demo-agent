import type { Promo } from '../data/site-data'

// Còn bao lâu tới endsAt; null nếu đã hết hạn hoặc endsAt không đọc được
export function timeLeft(endsAt: string, now: Date): { days: number; hours: number; minutes: number; seconds: number } | null {
  const ms = new Date(endsAt).getTime() - now.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  const total = Math.floor(ms / 1000)
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

// Khuyến mãi còn hiệu lực: có nội dung, có mã, hạn hợp lệ và chưa tới
export function isPromoActive(promo: Promo | null, now: Date): promo is Promo {
  return !!promo && !!promo.message && !!promo.code && timeLeft(promo.endsAt, now) !== null
}

// Gắn mã khuyến mãi vào cuối tin nhắn mẫu khi đang khuyến mãi
export function withPromoCode(message: string, promo: Promo | null, now: Date): string {
  return isPromoActive(promo, now) ? `${message} Mã: ${promo.code}` : message
}
