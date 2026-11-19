import { normalizeEmail } from '../users/normalize-email';

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;

// Đếm lần đăng nhập sai theo email, trong bộ nhớ (đủ cho một máy chủ).
// Mỗi lần thử phải giữ chỗ (reserve) TRƯỚC khi kiểm mật khẩu, nên các yêu cầu gửi đồng thời
// cũng bị tính: lần thử đang chạy chiếm một chỗ như một lần sai. Sai thì giữ nguyên chỗ đó;
// không phải lần sai (đúng mật khẩu nhưng bị khoá, lỗi hệ thống) thì release; đúng thì reset.
// Đủ MAX_FAILURES chỗ trong WINDOW_MS thì chặn cho tới khi các chỗ cũ hết hạn.
interface Attempt {
  ticket: number;
  at: number;
}

export class LoginAttempts {
  private readonly failures = new Map<string, Attempt[]>();
  private nextTicket = 1;

  constructor(private readonly now: () => number = Date.now) {}

  isBlocked(email: string): boolean {
    return this.recent(normalizeEmail(email)).length >= MAX_FAILURES;
  }

  // Trả về vé (số duy nhất) nếu còn được thử; null nếu đang bị chặn (không ghi thêm gì,
  // để lần bị chặn không kéo dài cửa sổ).
  reserve(email: string): number | null {
    const key = normalizeEmail(email);
    const recent = this.recent(key);
    if (recent.length >= MAX_FAILURES) return null;
    const ticket = this.nextTicket++;
    this.failures.set(key, [...recent, { ticket, at: this.now() }]);
    return ticket;
  }

  // Bỏ đúng chỗ của vé này (lần thử không tính là sai). Gọi lại lần nữa thì không làm gì.
  release(email: string, ticket: number): void {
    const key = normalizeEmail(email);
    const list = this.failures.get(key);
    if (!list) return;
    const rest = list.filter((a) => a.ticket !== ticket);
    if (rest.length) this.failures.set(key, rest);
    else this.failures.delete(key);
  }

  reset(email: string): void {
    this.failures.delete(normalizeEmail(email));
  }

  // Trả các lần sai còn trong cửa sổ; dọn mục đã hết hạn để Map không phình mãi.
  private recent(key: string): Attempt[] {
    const since = this.now() - WINDOW_MS;
    const kept = (this.failures.get(key) ?? []).filter((a) => a.at > since);
    if (kept.length) this.failures.set(key, kept);
    else this.failures.delete(key);
    return kept;
  }
}
