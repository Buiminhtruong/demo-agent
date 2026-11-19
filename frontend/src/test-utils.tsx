import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

export type MockReply = { status: number; body?: unknown };
export type MockRoutes = Record<string, MockReply | ((init?: RequestInit) => MockReply)>;

/** Giả lập fetch theo khoá "METHOD /đường-dẫn". Đường dẫn không khai báo thì trả 404. */
export function mockFetch(routes: MockRoutes) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const entry = routes[key];
    const reply = typeof entry === 'function' ? entry(init) : entry ?? { status: 404, body: { statusCode: 404, message: 'Not Found' } };
    const hasBody = reply.status !== 204 && reply.body !== undefined;
    return new Response(hasBody ? JSON.stringify(reply.body) : null, {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export const router = {
  future: { v7_startTransition: true, v7_relativeSplatPath: true },
} as const;

export function Providers({ children, initialEntries = ['/'] }: { children: ReactNode; initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries} future={router.future}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

export const tenant = { id: 1, email: 'a@x.vn', fullName: 'Nguyễn An', phone: '0901234567', role: 'tenant' as const };
export const landlord = { ...tenant, id: 2, fullName: 'Trần Bình', role: 'landlord' as const };
export const admin = { ...tenant, id: 3, fullName: 'Quản Trị', role: 'admin' as const };
