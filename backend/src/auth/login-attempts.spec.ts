import { LoginAttempts } from './login-attempts';

const MINUTE = 60 * 1000;

describe('LoginAttempts', () => {
  let now: number;
  let attempts: LoginAttempts;

  beforeEach(() => {
    now = 1_000_000;
    attempts = new LoginAttempts(() => now);
  });

  function failTimes(email: string, n: number) {
    for (let i = 0; i < n; i++) attempts.recordFailure(email);
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
});
