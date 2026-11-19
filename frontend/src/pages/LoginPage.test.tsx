import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage, { safeNext } from './LoginPage';
import { Providers, mockFetch, tenant } from '../test-utils';

function setup(entry: string) {
  render(
    <Providers initialEntries={[entry]}>
      <Routes>
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/phong/5" element={<div>Trang phòng 5</div>} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>
    </Providers>,
  );
}

function submit(email = 'a@x.vn', password = 'matkhau123') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('đăng nhập thành công với ?next=/phong/5 thì chuyển tới /phong/5', async () => {
    const fetchMock = mockFetch({
      'POST /api/auth/login': { status: 200, body: { accessToken: 'tok', user: tenant } },
    });
    setup('/dang-nhap?next=/phong/5');
    submit();
    expect(await screen.findByText('Trang phòng 5')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('tok');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ email: 'a@x.vn', password: 'matkhau123' });
  });

  it('không có next thì về trang chủ', async () => {
    mockFetch({ 'POST /api/auth/login': { status: 200, body: { accessToken: 'tok', user: tenant } } });
    setup('/dang-nhap');
    submit();
    expect(await screen.findByText('Trang chủ')).toBeInTheDocument();
  });

  it('lỗi 401 hiện "Email hoặc mật khẩu không đúng"', async () => {
    mockFetch({
      'POST /api/auth/login': { status: 401, body: { statusCode: 401, message: 'Email hoặc mật khẩu không đúng' } },
    });
    setup('/dang-nhap');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng');
  });

  it('lỗi 429 hiện thông báo thử lại sau 15 phút', async () => {
    mockFetch({
      'POST /api/auth/login': {
        status: 429,
        body: { statusCode: 429, message: 'Bạn nhập sai quá nhiều lần, thử lại sau 15 phút' },
      },
    });
    setup('/dang-nhap');
    submit();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Bạn nhập sai quá nhiều lần, thử lại sau 15 phút'),
    );
  });

  it('lỗi 403 hiện "Tài khoản đã bị khoá"', async () => {
    mockFetch({
      'POST /api/auth/login': { status: 403, body: { statusCode: 403, message: 'Tài khoản đã bị khoá' } },
    });
    setup('/dang-nhap');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Tài khoản đã bị khoá');
  });

  it.each(['//evil.com', '/%09/evil.com', '/\\evil.com', 'https://evil.com', '/%0A/evil.com'])(
    'không chuyển hướng ra ngoài khi next=%s',
    async (next) => {
      mockFetch({ 'POST /api/auth/login': { status: 200, body: { accessToken: 'tok', user: tenant } } });
      const assign = vi.fn();
      vi.stubGlobal('location', { ...window.location, assign, origin: window.location.origin });
      setup(`/dang-nhap?next=${next.replace('\\', '%5C')}`);
      submit();
      expect(await screen.findByText('Trang chủ')).toBeInTheDocument();
      expect(assign).not.toHaveBeenCalled();
    },
  );

  it('giữ nguyên next hợp lệ có query', async () => {
    mockFetch({ 'POST /api/auth/login': { status: 200, body: { accessToken: 'tok', user: tenant } } });
    setup('/dang-nhap?next=%2Fphong%2F5%3Fx%3D1');
    submit();
    expect(await screen.findByText('Trang phòng 5')).toBeInTheDocument();
  });

  it('safeNext xử lý các dạng đầu vào', () => {
    expect(safeNext('/\t/evil.com')).toBe('/');
    expect(safeNext('/\\evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('/phong/5?x=1')).toBe('/phong/5?x=1');
    expect(safeNext(null)).toBe('/');
  });
});
