import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MaxBytes, PASSWORD_MAX_BYTES, PASSWORD_TOO_LONG } from '../max-bytes';

// Decorator chạy từ DƯỚI lên (stopAtFirstError): kiểm tra "có nhập chưa" đặt sát tên trường.
export class LoginDto {
  @MaxLength(255, { message: 'Email tối đa 255 ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  @IsString({ message: 'Vui lòng nhập email' })
  email: string;

  @MaxBytes(PASSWORD_MAX_BYTES, { message: PASSWORD_TOO_LONG })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @IsString({ message: 'Vui lòng nhập mật khẩu' })
  password: string;
}
