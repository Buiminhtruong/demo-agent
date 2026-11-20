import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { landlord, mockFetch, router, tenant } from './test-utils';

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

  describe('form phòng không giữ dữ liệu cũ', () => {
    const roomA = {
      id: 7,
      title: 'Phòng gần trường',
      description: '',
      price: 3200000,
      area: 25,
      provinceCode: '01',
      provinceName: 'Hà Nội',
      districtCode: '001',
      districtName: 'Cầu Giấy',
      address: '12 Xuân Thuỷ',
      status: 'available',
      hiddenByOwner: false,
      hiddenByAdmin: false,
      photos: [],
      createdAt: '2026-11-01T00:00:00Z',
    };

    function renderLandlord(path: string) {
      localStorage.clear();
      localStorage.setItem('token', 'tok');
      mockFetch({
        'GET /api/auth/me': { status: 200, body: landlord },
        'GET /api/locations/provinces': { status: 200, body: [{ code: '01', name: 'Hà Nội' }] },
        'GET /api/locations/provinces/01/districts': {
          status: 200,
          body: [{ code: '001', name: 'Cầu Giấy', provinceCode: '01' }],
        },
        'GET /api/my/rooms/7': { status: 200, body: roomA },
      });
      let go: (to: string) => void = () => {};
      function NavProbe() {
        const navigate = useNavigate();
        go = (to) => navigate(to);
        return null;
      }
      render(
        <MemoryRouter initialEntries={[path]} future={router.future}>
          <AuthProvider>
            <App />
            <NavProbe />
          </AuthProvider>
        </MemoryRouter>,
      );
      return (to: string) => act(async () => go(to));
    }

    it('từ trang sửa sang /moi: form trống, không còn nhãn trạng thái', async () => {
      const goTo = renderLandlord('/chu-tro/phong/7');
      expect(await screen.findByDisplayValue('Phòng gần trường')).toBeInTheDocument();
      expect(screen.getByText('Còn trống')).toBeInTheDocument();
      await goTo('/chu-tro/phong/moi');
      expect(await screen.findByRole('heading', { name: 'Đăng phòng mới' })).toBeInTheDocument();
      expect(screen.getByLabelText('Tiêu đề')).toHaveValue('');
      expect(screen.queryByText('Còn trống')).not.toBeInTheDocument();
    });

    it('sửa phòng A rồi sang phòng B (404): không còn hiện phòng A', async () => {
      const goTo = renderLandlord('/chu-tro/phong/7');
      expect(await screen.findByDisplayValue('Phòng gần trường')).toBeInTheDocument();
      await goTo('/chu-tro/phong/8');
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Phòng gần trường')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Sửa phòng' })).not.toBeInTheDocument();
    });
  });
});
