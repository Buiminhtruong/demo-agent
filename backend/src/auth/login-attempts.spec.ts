import { LoginAttempts } from './login-attempts';

const MINUTE = 60 * 1000;

describe('LoginAttempts', () => {
  let now: number;
  let attempts: LoginAttempts;

  beforeEach(() => {
    now = 1_000_000;
    attempts = new LoginAttempts(() => now);
  });

  // Giữ chỗ n lần thử mà không trả lại = n lần sai.
  function failTimes(email: string, n: number) {
    for (let i = 0; i < n; i++) attempts.reserve(email);
  }

  it('chưa sai lần nào thì không bị chặn', () => {
    expect(attempts.isBlocked('a@x.com')).toBe(false);
  });

  it('sai 4 lần vẫn chưa bị chặn', () => {
    failTimes('a@x.com', 4);
    expect(attempts.isBlocked('a@x.com')).toBe(false);
  });

  it('sai 5 lần thì lần kế bị chặn', () => {
    failTimes('a@x.com', 5);
    expect(attempts.isBlocked('a@x.com')).toBe(true);
    expect(attempts.reserve('a@x.com')).toBeNull();
  });

  it('không phân biệt hoa thường và khoảng trắng của email', () => {
    failTimes(' A@X.com ', 5);
    expect(attempts.isBlocked('a@x.com')).toBe(true);
  });

  it('email khác không bị ảnh hưởng', () => {
    failTimes('a@x.com', 5);
    expect(attempts.isBlocked('b@x.com')).toBe(false);
  });

  it('hết 15 phút kể từ các lần sai thì hết bị chặn', () => {
    failTimes('a@x.com', 5);
    now += 15 * MINUTE - 1;
    expect(attempts.isBlocked('a@x.com')).toBe(true);
    now += 1;
    expect(attempts.isBlocked('a@x.com')).toBe(false);
  });

  it('chỉ đếm các lần sai trong 15 phút gần nhất', () => {
    failTimes('a@x.com', 3);
    now += 10 * MINUTE;
    failTimes('a@x.com', 2);
    now += 5 * MINUTE;
    // 3 lần đầu đã quá 15 phút -> còn 2 lần
    expect(attempts.isBlocked('a@x.com')).toBe(false);
  });

  it('đăng nhập đúng thì xoá các lần sai', () => {
    failTimes('a@x.com', 4);
    attempts.reset('A@x.com');
    failTimes('a@x.com', 4);
    expect(attempts.isBlocked('a@x.com')).toBe(false);
  });

  describe('dọn bộ đếm', () => {
    it('sai ở nhiều email khác nhau, quá 15 phút sau lần reserve kế tiếp dọn hết mục cũ', () => {
      for (let i = 0; i < 1000; i++) attempts.reserve(`u${i}@x.com`);
      expect(attempts.trackedEmails).toBe(1000);
      now += 15 * MINUTE + 1;
      attempts.reserve('khac@x.com');
      expect(attempts.trackedEmails).toBe(1);
    });

    it('không dọn mục còn trong cửa sổ', () => {
      failTimes('a@x.com', 5);
      now += 2 * MINUTE;
      attempts.reserve('b@x.com');
      expect(attempts.trackedEmails).toBe(2);
      expect(attempts.isBlocked('a@x.com')).toBe(true);
    });
  });

  describe('giữ chỗ (chống gửi đồng thời)', () => {
    it('các lần thử đang chạy cũng được tính: chỉ 5 lần đầu giữ được chỗ', () => {
      const results = Array.from({ length: 10 }, () =>
        attempts.reserve('a@x.com'),
      );
      expect(results.filter((r) => r !== null)).toHaveLength(5);
      expect(results.slice(5)).toEqual([null, null, null, null, null]);
    });

    it('lần bị chặn không kéo dài cửa sổ 15 phút', () => {
      failTimes('a@x.com', 5);
      now += 10 * MINUTE;
      expect(attempts.reserve('a@x.com')).toBeNull();
      now += 5 * MINUTE;
      expect(attempts.isBlocked('a@x.com')).toBe(false);
    });

    it('trả lại chỗ (không phải lần sai) thì không bị tính', () => {
      failTimes('a@x.com', 4);
      const ticket = attempts.reserve('a@x.com');
      expect(ticket).not.toBeNull();
      attempts.release('A@x.com', ticket as number);
      expect(attempts.isBlocked('a@x.com')).toBe(false);
    });

    it('trả lại chỉ bỏ đúng một chỗ', () => {
      failTimes('a@x.com', 4);
      const ticket = attempts.reserve('a@x.com') as number;
      attempts.release('a@x.com', ticket);
      attempts.release('a@x.com', ticket);
      failTimes('a@x.com', 1);
      expect(attempts.isBlocked('a@x.com')).toBe(true);
    });
  });
});
