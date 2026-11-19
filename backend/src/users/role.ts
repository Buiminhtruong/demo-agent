export const ROLES = ['tenant', 'landlord', 'admin'] as const;
export type Role = (typeof ROLES)[number];

// Vai trò được tự chọn khi đăng ký trên web (admin chỉ tạo bằng seed).
export const SELF_REGISTER_ROLES: Role[] = ['tenant', 'landlord'];
