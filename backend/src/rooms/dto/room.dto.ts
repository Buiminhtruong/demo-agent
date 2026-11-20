import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ROOM_STATUSES, RoomStatus } from '../room.entity';

const trim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value,
);

// Giới hạn trên để không tràn cột integer của PostgreSQL (tối đa ~2,1 tỷ).
export const PRICE_MAX = 2_000_000_000;
export const AREA_MAX = 100_000;

// Quy tắc từng trường, dùng chung cho tạo và sửa. Thứ tự trong mảng = thứ tự
// kiểm tra (kiểm "có nhập chưa / đúng kiểu" trước), vì ValidationPipe dùng
// stopAtFirstError nên mỗi trường chỉ báo lỗi đầu tiên.
const rules = {
  title: () => [
    trim,
    IsString({ message: 'Vui lòng nhập tiêu đề' }),
    IsNotEmpty({ message: 'Vui lòng nhập tiêu đề' }),
    Length(5, 120, { message: 'Tiêu đề từ 5 đến 120 ký tự' }),
  ],
  description: () => [
    trim,
    IsString({ message: 'Mô tả không hợp lệ' }),
    MaxLength(5000, { message: 'Mô tả tối đa 5000 ký tự' }),
  ],
  price: () => [
    IsInt({ message: 'Giá phải là số nguyên lớn hơn 0' }),
    Min(1, { message: 'Giá phải là số nguyên lớn hơn 0' }),
    Max(PRICE_MAX, { message: 'Giá tối đa 2.000.000.000 đồng' }),
  ],
  area: () => [
    IsInt({ message: 'Diện tích phải là số nguyên lớn hơn 0' }),
    Min(1, { message: 'Diện tích phải là số nguyên lớn hơn 0' }),
    Max(AREA_MAX, { message: 'Diện tích tối đa 100.000 m²' }),
  ],
  provinceCode: () => [
    trim,
    IsString({ message: 'Vui lòng chọn tỉnh/thành' }),
    IsNotEmpty({ message: 'Vui lòng chọn tỉnh/thành' }),
  ],
  districtCode: () => [
    trim,
    IsString({ message: 'Vui lòng chọn quận/huyện' }),
    IsNotEmpty({ message: 'Vui lòng chọn quận/huyện' }),
  ],
  address: () => [
    trim,
    IsString({ message: 'Vui lòng nhập địa chỉ' }),
    IsNotEmpty({ message: 'Vui lòng nhập địa chỉ' }),
    MaxLength(255, { message: 'Địa chỉ tối đa 255 ký tự' }),
  ],
  status: () => [IsIn(ROOM_STATUSES, { message: 'Tình trạng không hợp lệ' })],
  hiddenByOwner: () => [
    IsBoolean({ message: 'Giá trị ẩn tin không hợp lệ' }),
  ],
};

type RuleList = (PropertyDecorator | ReturnType<typeof Transform>)[];

// Bắt buộc (khi tạo).
const Required = (list: RuleList) =>
  applyDecorators(...(list as PropertyDecorator[]));
// Tuỳ chọn khi tạo: bỏ trống/null thì bỏ qua.
const Optional = (list: RuleList) =>
  applyDecorators(IsOptional(), ...(list as PropertyDecorator[]));
// Khi sửa: không gửi thì giữ nguyên; gửi (kể cả null) thì phải đúng quy tắc.
const IfPresent = (list: RuleList) =>
  applyDecorators(
    ValidateIf((_o, value) => value !== undefined),
    ...(list as PropertyDecorator[]),
  );

export class CreateRoomDto {
  @Required(rules.title())
  title: string;

  @Optional(rules.description())
  description?: string;

  @Required(rules.price())
  price: number;

  @Required(rules.area())
  area: number;

  @Required(rules.provinceCode())
  provinceCode: string;

  @Required(rules.districtCode())
  districtCode: string;

  @Required(rules.address())
  address: string;
}

export class UpdateRoomDto {
  @IfPresent(rules.title())
  title?: string;

  @IfPresent(rules.description())
  description?: string;

  @IfPresent(rules.price())
  price?: number;

  @IfPresent(rules.area())
  area?: number;

  @IfPresent(rules.provinceCode())
  provinceCode?: string;

  @IfPresent(rules.districtCode())
  districtCode?: string;

  @IfPresent(rules.address())
  address?: string;

  @IfPresent(rules.status())
  status?: RoomStatus;

  @IfPresent(rules.hiddenByOwner())
  hiddenByOwner?: boolean;
}

export const PHOTO_ORDER_MISMATCH = 'Danh sách ảnh không khớp';

export class ReorderPhotosDto {
  @IsArray({ message: PHOTO_ORDER_MISMATCH })
  @ArrayMaxSize(100, { message: PHOTO_ORDER_MISMATCH })
  @IsInt({ each: true, message: PHOTO_ORDER_MISMATCH })
  photoIds: number[];
}

export interface RoomPhotoDto {
  id: number;
  url: string;
}

export interface RoomDto {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  address: string;
  status: RoomStatus;
  hiddenByOwner: boolean;
  hiddenByAdmin: boolean;
  photos: RoomPhotoDto[];
  createdAt: Date;
}

export interface MyRoomDto extends RoomDto {
  pendingAppointmentCount: number;
}
