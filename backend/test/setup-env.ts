import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Mặc định cho e2e: DB test ở cổng 5433 (docker compose, service db-test).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://app:app@localhost:5433/app_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
// Ảnh tải lên trong e2e ghi vào thư mục tạm (luôn ghi đè), không bao giờ vào repo.
process.env.UPLOAD_DIR = join(
  tmpdir(),
  'web-thue-nha-e2e-uploads',
  String(process.pid),
);
