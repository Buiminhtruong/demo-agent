import { Role } from './role';
import { User } from './user.entity';

// Thông tin người dùng được phép trả ra API (không có passwordHash, isLocked).
export interface PublicUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
}

export function toPublicUser(user: User): PublicUser {
  const { id, email, fullName, phone, role } = user;
  return { id, email, fullName, phone, role };
}
