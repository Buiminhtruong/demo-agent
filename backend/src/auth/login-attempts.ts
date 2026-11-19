import { normalizeEmail } from '../users/normalize-email';

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;

// Đếm lần đăng nhập sai theo email, trong bộ nhớ (đủ cho một máy chủ).
// Sai đủ MAX_FAILURES lần trong WINDOW_MS thì chặn mọi lần thử tiếp cho tới khi các lần sai hết hạn.
export class LoginAttempts {
  private readonly failures = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  isBlocked(email: string): boolean {
    return this.recent(normalizeEmail(email)).length >= MAX_FAILURES;
  }

  recordFailure(email: string): void {
    const key = normalizeEmail(email);
    this.failures.set(key, [...this.recent(key), this.now()]);
  }

  reset(email: string): void {
    this.failures.delete(normalizeEmail(email));
  }

  // Trả các lần sai còn trong cửa sổ; dọn mục đã hết hạn để Map không phình mãi.
  private recent(key: string): number[] {
    const since = this.now() - WINDOW_MS;
    const kept = (this.failures.get(key) ?? []).filter((t) => t > since);
    if (kept.length) this.failures.set(key, kept);
    else this.failures.delete(key);
    return kept;
  }
}
