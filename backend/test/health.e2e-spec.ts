import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, resetDb } from './helpers';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('trả về 200 và { ok: true }', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
