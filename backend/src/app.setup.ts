import { INestApplication, ValidationPipe } from '@nestjs/common';

// Cấu hình chung cho main.ts và test e2e.
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  // stopAtFirstError: mỗi trường chỉ báo một lỗi (tránh lặp "Vui lòng nhập ..." hai lần).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
}
