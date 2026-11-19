import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { mockFetch, router } from './test-utils';

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
});
