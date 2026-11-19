import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  // Nạp backend/.env (nếu có) khi chạy thật; biến môi trường đã đặt sẵn được ưu tiên.
  // Chỉ main.ts nạp, nên test e2e không bị .env của dev ghi đè.
  if (existsSync('.env')) process.loadEnvFile('.env');

  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
