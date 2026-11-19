/** Khớp với backend: bcrypt chỉ dùng 72 byte đầu, nên giới hạn theo byte UTF-8 chứ không theo số ký tự. */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_TOO_LONG = 'Mật khẩu tối đa 72 byte (chữ có dấu tính 2–3 byte)';

export function passwordTooLong(password: string): boolean {
  return new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES;
}
