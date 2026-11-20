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

describe('api: Content-Type', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('body JSON → Content-Type application/json', async () => {
    const fetchMock = mockFetch({ 'POST /api/x': { status: 200, body: {} } });
    await api('/api/x', { method: 'POST', body: '{}' });
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('body FormData → không tự đặt Content-Type (trình duyệt tự thêm boundary)', async () => {
    const fetchMock = mockFetch({ 'POST /api/x': { status: 200, body: {} } });
    const form = new FormData();
    form.append('photos', new File(['a'], 'a.png', { type: 'image/png' }));
    await api('/api/x', { method: 'POST', body: form });
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(headers.has('Content-Type')).toBe(false);
  });
});
