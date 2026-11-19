import { INestApplication, ValidationPipe } from '@nestjs/common';

// Cấu hình chung cho main.ts và test e2e.
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
