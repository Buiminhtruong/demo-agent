import type { Contact } from '../data/site-data'

export function contactLinks(c: Contact): { zalo: string; telegram: string; phone: string } {
  const digits = (s: string) => s.replace(/\D/g, '')
  return {
    zalo: `https://zalo.me/${digits(c.zalo)}`,
    telegram: `https://t.me/${c.telegram.replace(/^@/, '')}`,
    phone: `tel:${digits(c.phone)}`,
  }
}