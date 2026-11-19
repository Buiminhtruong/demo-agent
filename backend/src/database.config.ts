import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const DEFAULT_DATABASE_URL = 'postgres://app:app@localhost:5432/app';

// Chỉ tự tạo/sửa bảng khi NODE_ENV được đặt rõ là development hoặc test.
// Thiếu NODE_ENV hoặc giá trị khác (production...) -> tắt, phải dùng migration.
export function shouldSynchronize(nodeEnv?: string): boolean {
  return nodeEnv === 'development' || nodeEnv === 'test';
}

// Cấu hình TypeORM dùng chung cho AppModule và script seed.
export function typeOrmOptions(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    autoLoadEntities: true,
    synchronize: shouldSynchronize(process.env.NODE_ENV),
  };
}
