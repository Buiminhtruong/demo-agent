import { ValidateBy, ValidationOptions } from 'class-validator';

/** bcrypt chỉ dùng 72 byte đầu: giới hạn mật khẩu theo byte UTF-8, không theo số ký tự. */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_TOO_LONG =
  'Mật khẩu tối đa 72 byte (chữ có dấu tính 2–3 byte)';

/** Chuỗi không quá `max` byte UTF-8. Giá trị không phải chuỗi để @IsString báo lỗi. */
export function MaxBytes(
  max: number,
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'maxBytes',
      constraints: [max],
      validator: {
        validate: (value: unknown) =>
          typeof value !== 'string' || Buffer.byteLength(value, 'utf8') <= max,
        defaultMessage: () => `Tối đa ${max} byte`,
      },
    },
    options,
  );
}
