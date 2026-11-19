// Không có JWT_SECRET thì dừng hẳn, không chạy với khoá mặc định.
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Thiếu biến môi trường JWT_SECRET');
  return secret;
}
