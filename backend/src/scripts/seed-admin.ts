import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isEmail } from 'class-validator';
import { hashPassword } from '../auth/password';
import { typeOrmOptions } from '../database.config';
import { normalizeEmail } from '../users/normalize-email';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

// Chỉ DB + users: không cần JWT_SECRET hay HTTP để chạy seed.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions }),
    UsersModule,
  ],
})
class SeedModule {}

// Tạo (hoặc nâng thành) tài khoản admin:
//   npm run seed:admin -- --email admin@example.com --password <mật khẩu ≥ 8 ký tự>
// Dùng DATABASE_URL từ môi trường hoặc backend/.env (giống main.ts).

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const email = normalizeEmail(argValue('email') ?? '');
  const password = argValue('password') ?? '';
  if (!isEmail(email) || password.length < 8 || password.length > 72) {
    console.error(
      'Cách dùng: npm run seed:admin -- --email <email> --password <mật khẩu 8–72 ký tự>',
    );
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  try {
    const { user, created } = await app
      .get(UsersService)
      .upsertAdmin(email, await hashPassword(password));
    console.log(
      `${created ? 'Đã tạo' : 'Đã cập nhật'} tài khoản admin ${user.email} (id ${user.id})`,
    );
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
