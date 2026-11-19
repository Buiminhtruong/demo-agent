import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role, SELF_REGISTER_ROLES } from '../../users/role';
import { MaxBytes, PASSWORD_MAX_BYTES, PASSWORD_TOO_LONG } from '../max-bytes';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Lưu ý: class-validator chạy decorator từ DƯỚI lên và ValidationPipe dùng
// stopAtFirstError, nên kiểm tra "có nhập chưa" đặt sát tên trường (chạy trước).
export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(255, { message: 'Email tối đa 255 ký tự' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @MaxBytes(PASSWORD_MAX_BYTES, { message: PASSWORD_TOO_LONG })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @IsString({ message: 'Vui lòng nhập mật khẩu' })
  password: string;

  @Transform(trim)
  @MaxLength(100, { message: 'Họ tên tối đa 100 ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @IsString({ message: 'Vui lòng nhập họ tên' })
  fullName: string;

  @Transform(trim)
  @Matches(/^\d{9,11}$/, { message: 'Số điện thoại phải gồm 9–11 chữ số' })
  @IsString({ message: 'Vui lòng nhập số điện thoại' })
  phone: string;

  @IsIn(SELF_REGISTER_ROLES, { message: 'Vai trò không hợp lệ' })
  role: Role;
}
