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

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{9,11}$/, { message: 'Số điện thoại phải gồm 9–11 chữ số' })
  phone: string;

  @IsIn(SELF_REGISTER_ROLES)
  role: Role;
}
