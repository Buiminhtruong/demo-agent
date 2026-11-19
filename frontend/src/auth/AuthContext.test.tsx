import { render, screen, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './AuthContext';
import { Providers, tenant, landlord } from '../test-utils';

let auth: ReturnType<typeof useAuth>;
function Probe() {
  auth = useAuth();
  return <div>{auth.loading ? 'loading' : auth.user ? `user:${auth.user.fullName}` : 'guest'}</div>;
}

/** fetch với /me bị trì hoãn: gọi resolveMe để trả lời. */
function setupDelayedMe() {
  let resolveMe!: (r: { status: number; body: unknown }) => void;
  const mePending = new Promise<{ status: number; body: unknown }>((r) => (resolveMe = r));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const key = `${init?.method ?? 'GET'} ${url}`;
      const reply =
        key === 'GET /api/auth/me'
          ? await mePending
          : key === 'POST /api/auth/login'
            ? { status: 200, body: { accessToken: 'fresh', user: landlord } }
            : { status: 404, body: { message: 'Not Found' } };
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return resolveMe;
}

describe('AuthProvider: /me trả về muộn', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    localStorage.setItem('token', 'stale');
  });

  it('A: /me cũ trả 401 sau khi đăng nhập thì không xoá token mới', async () => {
    const resolveMe = setupDelayedMe();
    render(<Providers><Probe /></Providers>);
    await act(async () => {
      await auth.login('b@x.vn', 'matkhau123');
    });
    await act(async () => {
      resolveMe({ status: 401, body: { statusCode: 401, message: 'Unauthorized' } });
    });
    await waitFor(() => expect(screen.getByText('user:Trần Bình')).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBe('fresh');
  });

  it('B: /me cũ trả về tài khoản khác sau khi đăng nhập thì không ghi đè user', async () => {
    const resolveMe = setupDelayedMe();
    render(<Providers><Probe /></Providers>);
    await act(async () => {
      await auth.login('b@x.vn', 'matkhau123');
    });
    await act(async () => {
      resolveMe({ status: 200, body: tenant });
    });
    expect(screen.getByText('user:Trần Bình')).toBeInTheDocument();
  });

  it('C: đăng xuất khi /me đang chờ thì /me không làm user sống lại', async () => {
    const resolveMe = setupDelayedMe();
    render(<Providers><Probe /></Providers>);
    act(() => auth.logout());
    await act(async () => {
      resolveMe({ status: 200, body: tenant });
    });
    await waitFor(() => expect(screen.getByText('guest')).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBeNull();
  });
});
