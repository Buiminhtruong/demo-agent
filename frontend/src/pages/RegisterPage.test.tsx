import { render, screen, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from './RegisterPage';
import { Providers, mockFetch, landlord } from '../test-utils';

function setup() {
  render(
    <Providers initialEntries={['/dang-ky']}>
      <Routes>
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>
    </Providers>,
  );
}

function fill() {
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Trần Bình' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'b@x.vn' } });
  fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0901234567' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'matkhau123' } });
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('có chọn vai trò "Tôi là người thuê" / "Tôi là chủ trọ"', () => {
    setup();
    expect(screen.getByLabelText('Tôi là người thuê')).toBeChecked();
    expect(screen.getByLabelText('Tôi là chủ trọ')).not.toBeChecked();
  });

  it('gửi đúng dữ liệu với vai trò chủ trọ rồi về trang chủ', async () => {
    const fetchMock = mockFetch({
      'POST /api/auth/register': { status: 201, body: { accessToken: 'tok', user: landlord } },
    });
    setup();
    fill();
    fireEvent.click(screen.getByLabelText('Tôi là chủ trọ'));
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(await screen.findByText('Trang chủ')).toBeInTheDocument();
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'b@x.vn',
      password: 'matkhau123',
      fullName: 'Trần Bình',
      phone: '0901234567',
      role: 'landlord',
    });
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('409 hiện "Email đã được sử dụng"', async () => {
    mockFetch({
      'POST /api/auth/register': { status: 409, body: { statusCode: 409, message: 'Email đã được sử dụng' } },
    });
    setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email đã được sử dụng');
  });

  it('400 với nhiều lỗi thì nối bằng "; "', async () => {
    mockFetch({
      'POST /api/auth/register': { status: 400, body: { statusCode: 400, message: ['lỗi một', 'lỗi hai'] } },
    });
    setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('lỗi một; lỗi hai');
  });
});
