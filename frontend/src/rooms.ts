import type { Room } from './api/types';

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const NO_PHOTO_WARNING = 'Phòng chưa có ảnh sẽ không hiện trên trang tìm kiếm';
export const DELETE_CONFIRM = 'Xoá phòng này? Các lịch hẹn đang mở sẽ bị huỷ.';

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(price)} đ/tháng`;
}

export function statusLabels(room: Pick<Room, 'status' | 'hiddenByOwner' | 'hiddenByAdmin'>): string[] {
  const labels = [room.status === 'rented' ? 'Đã cho thuê' : 'Còn trống'];
  if (room.hiddenByAdmin) labels.push('Bị admin ẩn');
  else if (room.hiddenByOwner) labels.push('Đang ẩn');
  return labels;
}

export interface RoomFields {
  title: string;
  description: string;
  price: string;
  area: string;
  provinceCode: string;
  districtCode: string;
  address: string;
}

/** Trả về thông báo lỗi đầu tiên, hoặc chuỗi rỗng nếu hợp lệ (cùng chữ với backend). */
export function validateRoom(f: RoomFields): string {
  const title = f.title.trim();
  if (title.length < 5 || title.length > 120) return 'Tiêu đề từ 5 đến 120 ký tự';
  if (f.description.length > 5000) return 'Mô tả tối đa 5000 ký tự';
  if (!/^\d+$/.test(f.price.trim()) || Number(f.price) < 1) return 'Giá phải là số nguyên lớn hơn 0';
  if (Number(f.price) > 2_000_000_000) return 'Giá tối đa 2.000.000.000 đồng';
  if (!/^\d+$/.test(f.area.trim()) || Number(f.area) < 1) return 'Diện tích phải là số nguyên lớn hơn 0';
  if (Number(f.area) > 100_000) return 'Diện tích tối đa 100.000 m²';
  if (!f.provinceCode) return 'Vui lòng chọn tỉnh/thành';
  if (!f.districtCode) return 'Vui lòng chọn quận/huyện';
  const address = f.address.trim();
  if (!address) return 'Vui lòng nhập địa chỉ';
  if (address.length > 255) return 'Địa chỉ tối đa 255 ký tự';
  return '';
}

/** Kiểm tra file ảnh mới chọn; `existing` = số ảnh đã có. Trả về lỗi đầu tiên hoặc rỗng. */
export function validatePhotoFiles(files: File[], existing: number): string {
  for (const file of files) {
    if (!PHOTO_TYPES.includes(file.type)) return 'Chỉ nhận ảnh JPG, PNG hoặc WebP';
    if (file.size > MAX_PHOTO_BYTES) return 'Mỗi ảnh tối đa 5 MB';
  }
  if (existing + files.length > MAX_PHOTOS) return 'Tối đa 10 ảnh';
  return '';
}

export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại';
}
