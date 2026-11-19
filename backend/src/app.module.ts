import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

const DEFAULT_DATABASE_URL = 'postgres://app:app@localhost:5432/app';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const env = process.env.NODE_ENV ?? 'development';
        return {
          type: 'postgres' as const,
          url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
          autoLoadEntities: true,
          // Chỉ tự tạo bảng ở dev/test; production phải dùng migration.
          synchronize: env === 'test' || env === 'development',
        };
      },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
