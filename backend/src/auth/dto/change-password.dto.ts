import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { MaxBytes, PASSWORD_MAX_BYTES, PASSWORD_TOO_LONG } from '../max-bytes';

// Decorator chạy từ DƯỚI lên (stopAtFirstError): kiểm tra "có nhập chưa" đặt sát tên trường.
export class ChangePasswordDto {
  @MaxBytes(PASSWORD_MAX_BYTES, { message: PASSWORD_TOO_LONG })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  @IsString({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword: string;

  @MaxBytes(PASSWORD_MAX_BYTES, { message: PASSWORD_TOO_LONG })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @IsString({ message: 'Vui lòng nhập mật khẩu mới' })
  newPassword: string;
}
