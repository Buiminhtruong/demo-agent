import { render, screen, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePasswordPage from './ChangePasswordPage';
import RequireRole from '../auth/RequireRole';
import LoginPage from './LoginPage';
import { Providers, mockFetch, tenant } from '../test-utils';

function setup() {
  render(
    <Providers initialEntries={['/doi-mat-khau']}>
      <Routes>
        <Route
          path="/doi-mat-khau"
          element={
            <RequireRole roles={['tenant', 'landlord', 'admin']}>
              <ChangePasswordPage />
            </RequireRole>
          }
        />
        <Route path="/dang-nhap" element={<LoginPage />} />
      </Routes>
    </Providers>,
  );
}

describe('ChangePasswordPage + RequireRole', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('chưa đăng nhập thì chuyển về /dang-nhap', async () => {
    mockFetch({});
    setup();
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  it('đổi mật khẩu thành công', async () => {
    localStorage.setItem('token', 'tok');
    const fetchMock = mockFetch({
      'GET /api/auth/me': { status: 200, body: tenant },
      'PATCH /api/auth/password': { status: 204 },
    });
    setup();
    fireEvent.change(await screen.findByLabelText('Mật khẩu hiện tại'), { target: { value: 'cu123456' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'moi123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã đổi mật khẩu');
    const call = fetchMock.mock.calls.find((c) => c[0] === '/api/auth/password')!;
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({
      currentPassword: 'cu123456',
      newPassword: 'moi123456',
    });
  });

  it('400 hiện "Mật khẩu hiện tại không đúng"', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch({
      'GET /api/auth/me': { status: 200, body: tenant },
      'PATCH /api/auth/password': {
        status: 400,
        body: { statusCode: 400, message: 'Mật khẩu hiện tại không đúng' },
      },
    });
    setup();
    fireEvent.change(await screen.findByLabelText('Mật khẩu hiện tại'), { target: { value: 'sai' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'moi123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu hiện tại không đúng');
  });

  it('401 (hết phiên) → đăng xuất, về trang đăng nhập với thông báo hết phiên', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch({
      'GET /api/auth/me': { status: 200, body: tenant },
      'PATCH /api/auth/password': { status: 401, body: { statusCode: 401, message: 'Unauthorized' } },
    });
    setup();
    fireEvent.change(await screen.findByLabelText('Mật khẩu hiện tại'), { target: { value: 'cu123456' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'moi123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Phiên đăng nhập đã hết, vui lòng đăng nhập lại');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('mật khẩu mới quá 72 byte (25 chữ có dấu) → báo lỗi, không gửi', async () => {
    localStorage.setItem('token', 'tok');
    const fetchMock = mockFetch({ 'GET /api/auth/me': { status: 200, body: tenant } });
    setup();
    fireEvent.change(await screen.findByLabelText('Mật khẩu hiện tại'), { target: { value: 'cu123456' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'ệ'.repeat(25) } });
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu tối đa 72 byte (chữ có dấu tính 2–3 byte)');
    expect(fetchMock.mock.calls.some((c) => c[0] === '/api/auth/password')).toBe(false);
  });
});
