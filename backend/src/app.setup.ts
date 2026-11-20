import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { uploadDir } from './rooms/photo-storage.service';

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
  // Ảnh phòng: /uploads/<uuid>.<đuôi>. Không liệt kê thư mục, không trả dotfile,
  // nosniff để trình duyệt không đoán loại nội dung.
  (app as NestExpressApplication).useStaticAssets(uploadDir(), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    redirect: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });
}
