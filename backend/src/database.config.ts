// Chỉ tự tạo/sửa bảng khi NODE_ENV được đặt rõ là development hoặc test.
// Thiếu NODE_ENV hoặc giá trị khác (production...) -> tắt, phải dùng migration.
export function shouldSynchronize(nodeEnv?: string): boolean {
  return nodeEnv === 'development' || nodeEnv === 'test';
}
