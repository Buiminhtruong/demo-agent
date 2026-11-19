import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { mockFetch, router, tenant } from './test-utils';

function renderAt(path: string) {
  localStorage.clear();
  mockFetch({});
  render(
    <MemoryRouter initialEntries={[path]} future={router.future}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('hiển thị logo ThuêPhòng trên Header', () => {
    renderAt('/dang-nhap');
    expect(screen.getByRole('link', { name: /ThuêPhòng/ })).toBeInTheDocument();
  });

  it('trang chủ "/" có lời chào và ghi chú trang tìm phòng', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Chào mừng đến ThuêPhòng' })).toBeInTheDocument();
    expect(screen.getByText('Trang tìm phòng sẽ có ở bản tiếp theo')).toBeInTheDocument();
  });

  it('đường dẫn chưa có trang → "Trang này đang được xây dựng"', () => {
    renderAt('/tim-phong');
    expect(screen.getByText('Trang này đang được xây dựng')).toBeInTheDocument();
  });

  it('đăng xuất khi đang ở /doi-mat-khau → về trang chủ "/", xoá token', async () => {
    localStorage.clear();
    localStorage.setItem('token', 'tok');
    mockFetch({ 'GET /api/auth/me': { status: 200, body: tenant } });
    let location = '';
    function LocationProbe() {
      const loc = useLocation();
      location = loc.pathname + loc.search;
      return null;
    }
    render(
      <MemoryRouter initialEntries={['/doi-mat-khau']} future={router.future}>
        <AuthProvider>
          <App />
          <LocationProbe />
        </AuthProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Nguyễn An/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));

    expect(await screen.findByRole('heading', { name: 'Chào mừng đến ThuêPhòng' })).toBeInTheDocument();
    // Chờ thêm một nhịp để chắc không có chuyển hướng muộn sang trang đăng nhập.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(location).toBe('/');
    expect(screen.getByRole('heading', { name: 'Chào mừng đến ThuêPhòng' })).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
