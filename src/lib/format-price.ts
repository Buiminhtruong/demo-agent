export function formatPrice(vnd: number): string {
  const digits = String(Math.round(vnd))
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
}