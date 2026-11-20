import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoomFormPage from './RoomFormPage';
import RequireRole from '../auth/RequireRole';
import { Providers, landlord, mockFetch, type MockRoutes } from '../test-utils';
import type { Room } from '../api/types';

const provinces = [
  { code: '01', name: 'Hà Nội' },
  { code: '79', name: 'TP. Hồ Chí Minh' },
];
const districts01 = [{ code: '001', name: 'Cầu Giấy', provinceCode: '01' }];
const districts79 = [{ code: '760', name: 'Quận 1', provinceCode: '79' }];

function room(over: Partial<Room> = {}): Room {
  return {
    id: 7,
    title: 'Phòng gần trường',
    description: 'Thoáng mát',
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
    ...over,
  };
}

const baseRoutes: MockRoutes = {
  'GET /api/auth/me': { status: 200, body: landlord },
  'GET /api/locations/provinces': { status: 200, body: provinces },
  'GET /api/locations/provinces/01/districts': { status: 200, body: districts01 },
  'GET /api/locations/provinces/79/districts': { status: 200, body: districts79 },
};

function setup(path: string, state?: unknown) {
  render(
    <Providers initialEntries={[state ? { pathname: path, state } : path] as never}>
      <Routes>
        <Route
          path="/chu-tro/phong/moi"
          element={
            <RequireRole roles={['landlord']}>
              <RoomFormPage />
            </RequireRole>
          }
        />
        <Route
          path="/chu-tro/phong/:id"
          element={
            <RequireRole roles={['landlord']}>
              <RoomFormPage />
            </RequireRole>
          }
        />
        <Route path="/chu-tro/phong" element={<p>Danh sách phòng của tôi</p>} />
      </Routes>
    </Providers>,
  );
}

function pngFile(name = 'a.png', type = 'image/png', size = 10) {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

function jsonBody(call: unknown[]) {
  return JSON.parse((call[1] as RequestInit).body as string);
}

async function fillValidForm() {
  fireEvent.change(await screen.findByLabelText('Tiêu đề'), { target: { value: 'Phòng mới đẹp' } });
  fireEvent.change(screen.getByLabelText('Mô tả'), { target: { value: 'Gần chợ' } });
  fireEvent.change(screen.getByLabelText('Giá (đồng/tháng)'), { target: { value: '3200000' } });
  fireEvent.change(screen.getByLabelText('Diện tích (m²)'), { target: { value: '25' } });
  await screen.findByRole('option', { name: 'Hà Nội' });
  fireEvent.change(screen.getByLabelText('Tỉnh/Thành phố'), { target: { value: '01' } });
  await screen.findByRole('option', { name: 'Cầu Giấy' });
  fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: '001' } });
  fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: '12 Xuân Thuỷ' } });
}

describe('RoomFormPage: đăng phòng mới', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'tok');
    vi.unstubAllGlobals();
  });

  it('đổi tỉnh thì nạp lại quận và xoá quận đã chọn', async () => {
    const fetchMock = mockFetch(baseRoutes);
    setup('/chu-tro/phong/moi');
    await screen.findByRole('option', { name: 'Hà Nội' });
    fireEvent.change(screen.getByLabelText('Tỉnh/Thành phố'), { target: { value: '01' } });
    await screen.findByRole('option', { name: 'Cầu Giấy' });
    fireEvent.change(screen.getByLabelText('Quận/Huyện'), { target: { value: '001' } });
    expect(screen.getByLabelText('Quận/Huyện')).toHaveValue('001');

    fireEvent.change(screen.getByLabelText('Tỉnh/Thành phố'), { target: { value: '79' } });
    await screen.findByRole('option', { name: 'Quận 1' });
    expect(screen.queryByRole('option', { name: 'Cầu Giấy' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Quận/Huyện')).toHaveValue('');
    expect(fetchMock.mock.calls.some((c) => c[0] === '/api/locations/provinces/79/districts')).toBe(true);
  });

  it('gửi form: POST phòng (số nguyên) rồi POST ảnh dạng FormData không có Content-Type JSON, rồi về danh sách', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes,
      'POST /api/my/rooms': { status: 201, body: room({ id: 9 }) },
      'POST /api/my/rooms/9/photos': { status: 201, body: room({ id: 9, photos: [{ id: 1, url: '/u/1.png' }] }) },
    });
    setup('/chu-tro/phong/moi');
    await fillValidForm();
    expect(screen.getByText('Phòng chưa có ảnh sẽ không hiện trên trang tìm kiếm')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Thêm ảnh'), { target: { files: [pngFile()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng phòng' }));

    expect(await screen.findByText('Danh sách phòng của tôi')).toBeInTheDocument();
    const create = fetchMock.mock.calls.find((c) => c[0] === '/api/my/rooms')!;
    expect((create[1] as RequestInit).method).toBe('POST');
    expect(jsonBody(create)).toEqual({
      title: 'Phòng mới đẹp',
      description: 'Gần chợ',
      price: 3200000,
      area: 25,
      provinceCode: '01',
      districtCode: '001',
      address: '12 Xuân Thuỷ',
    });
    const upload = fetchMock.mock.calls.find((c) => c[0] === '/api/my/rooms/9/photos')!;
    const body = (upload[1] as RequestInit).body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.getAll('photos')).toHaveLength(1);
    expect(((upload[1] as RequestInit).headers as Headers).has('Content-Type')).toBe(false);
  });

  it('upload ảnh lỗi: giữ phòng, chuyển sang trang sửa và báo lỗi ảnh', async () => {
    mockFetch({
      ...baseRoutes,
      'POST /api/my/rooms': { status: 201, body: room({ id: 9 }) },
      'POST /api/my/rooms/9/photos': { status: 400, body: { statusCode: 400, message: 'Ảnh bị hỏng' } },
      'GET /api/my/rooms/9': { status: 200, body: room({ id: 9 }) },
    });
    setup('/chu-tro/phong/moi');
    await fillValidForm();
    fireEvent.change(screen.getByLabelText('Thêm ảnh'), { target: { files: [pngFile()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng phòng' }));
    expect(await screen.findByRole('heading', { name: 'Sửa phòng' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Phòng đã được lưu nhưng tải ảnh lỗi: Ảnh bị hỏng');
  });

  it.each([
    ['Tiêu đề', 'abc', 'Tiêu đề từ 5 đến 120 ký tự'],
    ['Giá (đồng/tháng)', '0', 'Giá phải là số nguyên lớn hơn 0'],
    ['Giá (đồng/tháng)', '2000000001', 'Giá tối đa 2.000.000.000 đồng'],
    ['Diện tích (m²)', '1.5', 'Diện tích phải là số nguyên lớn hơn 0'],
    ['Diện tích (m²)', '100001', 'Diện tích tối đa 100.000 m²'],
    ['Địa chỉ', '   ', 'Vui lòng nhập địa chỉ'],
  ])('sai %s=%s → báo "%s" và không gọi API', async (label, value, message) => {
    const fetchMock = mockFetch(baseRoutes);
    setup('/chu-tro/phong/moi');
    await fillValidForm();
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng phòng' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(fetchMock.mock.calls.some((c) => c[0] === '/api/my/rooms')).toBe(false);
  });

  it('chưa chọn tỉnh → báo "Vui lòng chọn tỉnh/thành" (cùng chữ với server) và không gọi API', async () => {
    const fetchMock = mockFetch(baseRoutes);
    setup('/chu-tro/phong/moi');
    await fillValidForm();
    fireEvent.change(screen.getByLabelText('Tỉnh/Thành phố'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng phòng' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/^Vui lòng chọn tỉnh\/thành$/);
    expect(fetchMock.mock.calls.some((c) => c[0] === '/api/my/rooms')).toBe(false);
  });

  it('ảnh sai định dạng / quá 5 MB / quá 10 ảnh bị từ chối ngay', async () => {
    mockFetch(baseRoutes);
    setup('/chu-tro/phong/moi');
    const input = await screen.findByLabelText('Thêm ảnh');
    fireEvent.change(input, { target: { files: [pngFile('a.gif', 'image/gif')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    fireEvent.change(input, { target: { files: [pngFile('big.png', 'image/png', 5 * 1024 * 1024 + 1)] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Mỗi ảnh tối đa 5 MB');
    fireEvent.change(input, { target: { files: Array.from({ length: 11 }, (_, i) => pngFile(`${i}.png`)) } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Tối đa 10 ảnh');
  });

  it('lỗi từ server khi tạo phòng được hiển thị', async () => {
    mockFetch({
      ...baseRoutes,
      'POST /api/my/rooms': { status: 400, body: { statusCode: 400, message: ['Giá không hợp lệ', 'Khác'] } },
    });
    setup('/chu-tro/phong/moi');
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng phòng' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Giá không hợp lệ; Khác');
  });
});

describe('RoomFormPage: sửa phòng', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'tok');
    vi.unstubAllGlobals();
  });

  it('nạp dữ liệu phòng, lưu bằng PATCH', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes,
      'GET /api/my/rooms/7': { status: 200, body: room({ photos: [{ id: 1, url: '/u/1.png' }] }) },
      'PATCH /api/my/rooms/7': { status: 200, body: room() },
    });
    setup('/chu-tro/phong/7');
    await waitFor(() => expect(screen.getByLabelText('Quận/Huyện')).toHaveValue('001'));
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Phòng gần trường');
    expect(screen.getByLabelText('Giá (đồng/tháng)')).toHaveValue('3200000');
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Phòng đã sửa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu');
    const call = fetchMock.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'PATCH')!;
    expect(jsonBody(call)).toEqual({
      title: 'Phòng đã sửa',
      description: 'Thoáng mát',
      price: 3200000,
      area: 25,
      provinceCode: '01',
      districtCode: '001',
      address: '12 Xuân Thuỷ',
    });
  });

  it('phòng chưa có ảnh: cảnh báo; bị admin ẩn: nhãn nổi bật; hiện lỗi ảnh từ lúc tạo', async () => {
    mockFetch({
      ...baseRoutes,
      'GET /api/my/rooms/7': { status: 200, body: room({ hiddenByAdmin: true }) },
    });
    setup('/chu-tro/phong/7', { photoError: 'Phòng đã được lưu nhưng tải ảnh lỗi: Ảnh bị hỏng' });
    expect(await screen.findByText('Phòng chưa có ảnh sẽ không hiện trên trang tìm kiếm')).toBeInTheDocument();
    expect(screen.getByText('Bị admin ẩn')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Phòng đã được lưu nhưng tải ảnh lỗi: Ảnh bị hỏng');
  });

  it('ảnh đầu ghi "Ảnh đại diện"; ↓ gọi PUT order; xoá ảnh gọi DELETE', async () => {
    const two = [
      { id: 1, url: '/u/1.png' },
      { id: 2, url: '/u/2.png' },
    ];
    const fetchMock = mockFetch({
      ...baseRoutes,
      'GET /api/my/rooms/7': { status: 200, body: room({ photos: two }) },
      'PUT /api/my/rooms/7/photos/order': { status: 200, body: room({ photos: [two[1], two[0]] }) },
      'DELETE /api/my/rooms/7/photos/2': { status: 200, body: room({ photos: [two[0]] }) },
    });
    setup('/chu-tro/phong/7');
    expect(await screen.findByText('Ảnh đại diện')).toBeInTheDocument();
    expect(screen.queryByText('Phòng chưa có ảnh sẽ không hiện trên trang tìm kiếm')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chuyển ảnh 1 lên' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Chuyển ảnh 1 xuống' }));
    await waitFor(() => expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', '/u/2.png'));
    const put = fetchMock.mock.calls.find((c) => c[0] === '/api/my/rooms/7/photos/order')!;
    expect((put[1] as RequestInit).method).toBe('PUT');
    expect(jsonBody(put)).toEqual({ photoIds: [2, 1] });

    fireEvent.click(screen.getByRole('button', { name: 'Xoá ảnh 1' }));
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1));
    expect(
      fetchMock.mock.calls.some(
        (c) => c[0] === '/api/my/rooms/7/photos/2' && (c[1] as RequestInit).method === 'DELETE',
      ),
    ).toBe(true);
  });

  it('thêm ảnh ở trang sửa gọi POST photos bằng FormData', async () => {
    const fetchMock = mockFetch({
      ...baseRoutes,
      'GET /api/my/rooms/7': { status: 200, body: room() },
      'POST /api/my/rooms/7/photos': { status: 201, body: room({ photos: [{ id: 3, url: '/u/3.png' }] }) },
    });
    setup('/chu-tro/phong/7');
    fireEvent.change(await screen.findByLabelText('Thêm ảnh'), { target: { files: [pngFile()] } });
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1));
    const upload = fetchMock.mock.calls.find((c) => c[0] === '/api/my/rooms/7/photos')!;
    expect((upload[1] as RequestInit).body).toBeInstanceOf(FormData);
    expect(((upload[1] as RequestInit).headers as Headers).has('Content-Type')).toBe(false);
  });
});
