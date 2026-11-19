import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { Providers, mockFetch, tenant, landlord, admin } from '../test-utils';
import type { PublicUser } from '../api/types';

async function renderAs(user: PublicUser | null) {
  if (user) {
    localStorage.setItem('token', 'tok');
    mockFetch({ 'GET /api/auth/me': { status: 200, body: user } });
  } else {
    mockFetch({});
  }
  render(
    <Providers>
      <Header />
    </Providers>,
  );
  if (user) await screen.findByText(user.fullName);
}

const link = (name: string | RegExp) => screen.queryByRole('link', { name });

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('khách: Tìm phòng, Đăng nhập, Đăng ký', async () => {
    await renderAs(null);
    expect(link('Tìm phòng')).toHaveAttribute('href', '/tim-phong');
    expect(link('Đăng nhập')).toHaveAttribute('href', '/dang-nhap');
    expect(link('Đăng ký')).toHaveAttribute('href', '/dang-ky');
    expect(link('Lịch hẹn của tôi')).toBeNull();
  });

  it('tenant: Tìm phòng, Lịch hẹn của tôi, tên', async () => {
    await renderAs(tenant);
    expect(link('Tìm phòng')).toBeInTheDocument();
    expect(link('Lịch hẹn của tôi')).toHaveAttribute('href', '/lich-hen');
    expect(link('Đăng nhập')).toBeNull();
    expect(link('Phòng của tôi')).toBeNull();
  });

  it('landlord: Phòng của tôi, Lịch hẹn', async () => {
    await renderAs(landlord);
    expect(link('Phòng của tôi')).toHaveAttribute('href', '/chu-tro/phong');
    expect(link('Lịch hẹn')).toHaveAttribute('href', '/chu-tro/lich-hen');
    expect(link('Tìm phòng')).toBeNull();
  });

  it('admin: Quản lý tin, Quản lý tài khoản', async () => {
    await renderAs(admin);
    expect(link('Quản lý tin')).toHaveAttribute('href', '/admin/phong');
    expect(link('Quản lý tài khoản')).toHaveAttribute('href', '/admin/tai-khoan');
    expect(link('Tìm phòng')).toBeNull();
  });

  it('menu người dùng có Đổi mật khẩu và Đăng xuất; đăng xuất xoá token', async () => {
    await renderAs(tenant);
    fireEvent.click(screen.getByRole('button', { name: /Nguyễn An/ }));
    expect(screen.getByRole('link', { name: 'Đổi mật khẩu' })).toHaveAttribute('href', '/doi-mat-khau');
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(localStorage.getItem('token')).toBeNull();
    expect(await screen.findByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument();
  });
});
