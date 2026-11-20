import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '../database.config';
import { LocationsModule } from '../locations/locations.module';
import { LocationsService } from '../locations/locations.service';

// Chỉ DB + locations: không cần JWT_SECRET hay HTTP để chạy seed.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions }),
    LocationsModule,
  ],
})
class SeedModule {}

// Nạp tỉnh/thành, quận/huyện từ src/locations/data/vn-locations.json:
//   npm run seed:locations
// Chạy lại nhiều lần không tạo trùng. Dùng DATABASE_URL từ môi trường hoặc backend/.env.
async function main() {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  try {
    const service = app.get(LocationsService);
    await service.seedFromFile();
    const provinces = await service.listProvinces();
    console.log(`Đã nạp ${provinces.length} tỉnh/thành`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
