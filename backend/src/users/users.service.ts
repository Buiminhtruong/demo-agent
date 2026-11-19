import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeEmail } from './normalize-email';
import { Role } from './role';
import { User } from './user.entity';

export interface NewUser {
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email: normalizeEmail(email) });
  }

  create(data: NewUser): Promise<User> {
    return this.users.save(
      this.users.create({ ...data, email: normalizeEmail(data.email) }),
    );
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.users.update({ id }, { passwordHash });
  }

  // Dùng cho seed: tạo mới hoặc nâng tài khoản có sẵn thành admin (mở khoá, đặt mật khẩu mới).
  async upsertAdmin(
    email: string,
    passwordHash: string,
  ): Promise<{ user: User; created: boolean }> {
    const existing = await this.findByEmail(email);
    if (existing) {
      existing.role = 'admin';
      existing.passwordHash = passwordHash;
      existing.isLocked = false;
      return { user: await this.users.save(existing), created: false };
    }
    const user = await this.create({
      email,
      passwordHash,
      fullName: 'Quản trị viên',
      phone: '',
      role: 'admin',
    });
    return { user, created: true };
  }
}
