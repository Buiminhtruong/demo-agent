import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyRoomsPage from './MyRoomsPage';
import RequireRole from '../auth/RequireRole';
import { Providers, landlord, mockFetch, tenant } from '../test-utils';
import type { Room } from '../api/types';

function room(over: Partial<Room>): Room {
  return {
    id: 1,
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
    photos: [{ id: 5, url: '/uploads/a.jpg' }],
    createdAt: '2026-11-01T00:00:00Z',
    pendingAppointmentCount: 0,
    ...over,
  };
}

function setup() {
  render(
    <Providers initialEntries={['/chu-tro/phong']}>
      <Routes>
        <Route
          path="/chu-tro/phong"
          element={
            <RequireRole roles={['landlord']}>
              <MyRoomsPage />
            </RequireRole>
          }
        />
        <Route path="/chu-tro/phong/moi" element={<p>Trang đăng phòng</p>} />
        <Route path="/chu-tro/phong/:id" element={<p>Trang sửa phòng</p>} />
        <Route path="/" element={<p>Trang chủ</p>} />
      </Routes>
    </Providers>,
  );
}

function card(title: string) {
  return within(screen.getByText(title).closest('li') as HTMLElement);
}

describe('MyRoomsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'tok');
    vi.unstubAllGlobals();
  });
  afterEach(() => vi.restoreAllMocks());

  it('hiện giá định dạng vi-VN, ảnh đại diện và đúng nhãn trạng thái', async () => {
    mockFetch({
      'GET /api/auth/me': { status: 200, body: landlord },
      'GET /api/my/rooms': {
        status: 200,
        body: [
          room({ id: 1, title: 'Phòng A' }),
          room({ id: 2, title: 'Phòng B', status: 'rented' }),
          room({ id: 3, title: 'Phòng C', hiddenByOwner: true }),
          room({ id: 4, title: 'Phòng D', hiddenByAdmin: true, photos: [], pendingAppointmentCount: 2 }),
        ],
      },
    });
    setup();
    expect(await screen.findByText('Phòng A')).toBeInTheDocument();
    expect(card('Phòng A').getByText('3.200.000 đ/tháng')).toBeInTheDocument();
    expect(card('Phòng A').getByText('Còn trống')).toBeInTheDocument();
    expect(card('Phòng A').getByRole('img')).toHaveAttribute('src', '/uploads/a.jpg');
    expect(card('Phòng B').getByText('Đã cho thuê')).toBeInTheDocument();
    expect(card('Phòng C').getByText('Đang ẩn')).toBeInTheDocument();
    expect(card('Phòng D').getByText('Bị admin ẩn')).toBeInTheDocument();
    expect(card('Phòng D').getByText(NO_PHOTO)).toBeInTheDocument();
    expect(card('Phòng D').getByText('2 lịch hẹn chờ duyệt')).toBeInTheDocument();
    expect(card('Phòng D').getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/chu-tro/phong/4');
  });

  it('danh sách rỗng', async () => {
    mockFetch({ 'GET /api/auth/me': { status: 200, body: landlord }, 'GET /api/my/rooms': { status: 200, body: [] } });
    setup();
    expect(await screen.findByText('Bạn chưa đăng phòng nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng phòng mới' })).toHaveAttribute('href', '/chu-tro/phong/moi');
  });

  it('Xoá: có hỏi xác nhận; huỷ thì không gọi API, đồng ý thì DELETE và bỏ khỏi danh sách', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': { status: 200, body: landlord },
      'GET /api/my/rooms': { status: 200, body: [room({ id: 1, title: 'Phòng A' })] },
      'DELETE /api/my/rooms/1': { status: 204 },
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    setup();
    await screen.findByText('Phòng A');
    fireEvent.click(card('Phòng A').getByRole('button', { name: 'Xoá' }));
    expect(confirm).toHaveBeenCalledWith('Xoá phòng này? Các lịch hẹn đang mở sẽ bị huỷ.');
    expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'DELETE')).toBe(false);

    confirm.mockReturnValue(true);
    fireEvent.click(card('Phòng A').getByRole('button', { name: 'Xoá' }));
    await waitFor(() => expect(screen.queryByText('Phòng A')).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some((c) => c[0] === '/api/my/rooms/1' && (c[1] as RequestInit).method === 'DELETE')).toBe(
      true,
    );
  });

  it('Ẩn / Hiện gửi PATCH hiddenByOwner và cập nhật nhãn', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': { status: 200, body: landlord },
      'GET /api/my/rooms': { status: 200, body: [room({ id: 1, title: 'Phòng A' })] },
      'PATCH /api/my/rooms/1': { status: 200, body: room({ id: 1, title: 'Phòng A', hiddenByOwner: true }) },
    });
    setup();
    await screen.findByText('Phòng A');
    fireEvent.click(card('Phòng A').getByRole('button', { name: 'Ẩn' }));
    expect(await card('Phòng A').findByText('Đang ẩn')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find((c) => c[0] === '/api/my/rooms/1' && (c[1] as RequestInit).method === 'PATCH')!;
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({ hiddenByOwner: true });
    expect(card('Phòng A').getByRole('button', { name: 'Hiện' })).toBeInTheDocument();
  });

  it('Đánh dấu đã cho thuê gửi PATCH status', async () => {
    const fetchMock = mockFetch({
      'GET /api/auth/me': { status: 200, body: landlord },
      'GET /api/my/rooms': { status: 200, body: [room({ id: 1, title: 'Phòng A' })] },
      'PATCH /api/my/rooms/1': { status: 200, body: room({ id: 1, title: 'Phòng A', status: 'rented' }) },
    });
    setup();
    await screen.findByText('Phòng A');
    fireEvent.click(card('Phòng A').getByRole('button', { name: 'Đánh dấu đã cho thuê' }));
    expect(await card('Phòng A').findByText('Đã cho thuê')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'PATCH')!;
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({ status: 'rented' });
    expect(card('Phòng A').getByRole('button', { name: 'Đánh dấu còn trống' })).toBeInTheDocument();
  });

  it('lỗi từ server được hiển thị', async () => {
    mockFetch({
      'GET /api/auth/me': { status: 200, body: landlord },
      'GET /api/my/rooms': { status: 200, body: [room({ id: 1, title: 'Phòng A' })] },
      'PATCH /api/my/rooms/1': { status: 400, body: { statusCode: 400, message: 'Không thể cập nhật' } },
    });
    setup();
    await screen.findByText('Phòng A');
    fireEvent.click(card('Phòng A').getByRole('button', { name: 'Ẩn' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể cập nhật');
  });

  it('người thuê không vào được trang', async () => {
    mockFetch({ 'GET /api/auth/me': { status: 200, body: tenant } });
    setup();
    expect(await screen.findByText('Bạn không có quyền truy cập trang này.')).toBeInTheDocument();
  });
});

const NO_PHOTO = 'Phòng chưa có ảnh sẽ không hiện trên trang tìm kiếm';
