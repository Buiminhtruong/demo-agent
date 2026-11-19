import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, SESSION_EXPIRED, setUnauthorizedHandler } from './client';
import { mockFetch } from '../test-utils';

describe('api: xử lý 401 tập trung', () => {
  const handle = vi.fn();
  let snapshot = 7;

  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    handle.mockReset();
    snapshot = 7;
    setUnauthorizedHandler({ snapshot: () => snapshot, handle });
  });

  afterEach(() => setUnauthorizedHandler(null));

  it('401 ở API khác → thông báo hết phiên và gọi handler với phiên lúc gửi', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch({ 'PATCH /api/auth/password': { status: 401, body: { statusCode: 401, message: 'Unauthorized' } } });
    const p = api('/api/auth/password', { method: 'PATCH', body: '{}' });
    snapshot = 8; // phiên đổi trong lúc chờ: handler nhận số phiên lúc gửi để tự bỏ qua
    await expect(p).rejects.toEqual(new ApiError(401, SESSION_EXPIRED));
    expect(SESSION_EXPIRED).toBe('Phiên đăng nhập đã hết, vui lòng đăng nhập lại');
    expect(handle).toHaveBeenCalledWith(7);
  });

  it('401 của POST /api/auth/login giữ thông báo của server, không gọi handler', async () => {
    mockFetch({
      'POST /api/auth/login': { status: 401, body: { statusCode: 401, message: 'Email hoặc mật khẩu không đúng' } },
    });
    await expect(api('/api/auth/login', { method: 'POST', body: '{}' })).rejects.toEqual(
      new ApiError(401, 'Email hoặc mật khẩu không đúng'),
    );
    expect(handle).not.toHaveBeenCalled();
  });
});
