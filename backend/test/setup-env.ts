// Mặc định cho e2e: DB test ở cổng 5433 (docker compose, service db-test).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://app:app@localhost:5433/app_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
