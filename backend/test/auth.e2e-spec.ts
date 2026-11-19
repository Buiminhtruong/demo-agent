import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp, resetDb } from './helpers';

const PASSWORD = 'matkhau123';

function tenantBody(overrides: Record<string, unknown> = {}) {
  return {
    email: 'thue@example.com',
    password: PASSWORD,
    fullName: 'Người Thuê',
    phone: '0901234567',
    role: 'tenant',
    ...overrides,
  };
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const register = (body: Record<string, unknown>) =>
    request(http).post('/api/auth/register').send(body);
  const login = (email: string, password: string) =>
    request(http).post('/api/auth/login').send({ email, password });

  describe('POST /api/auth/register', () => {
    it('đăng ký tenant: 201, trả token và PublicUser (không lộ passwordHash/isLocked)', async () => {
      const res = await register(tenantBody({ email: ' Thue@Example.COM ' }));
      expect(res.status).toBe(201);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toEqual({
        id: expect.any(Number),
        email: 'thue@example.com',
        fullName: 'Người Thuê',
        phone: '0901234567',
        role: 'tenant',
      });
    });

    it('đăng ký landlord: 201', async () => {
      const res = await register(
        tenantBody({ email: 'chu@example.com', role: 'landlord' }),
      );
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('landlord');
    });

    it('email trùng (kể cả khác hoa thường) → 409', async () => {
      await register(tenantBody()).expect(201);
      const res = await register(tenantBody({ email: 'THUE@example.com' }));
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email đã được sử dụng');
    });

    it('role admin → 400', async () => {
      const res = await register(tenantBody({ role: 'admin' }));
      expect(res.status).toBe(400);
    });

    it('mật khẩu ngắn hơn 8 ký tự → 400', async () => {
      const res = await register(tenantBody({ password: '1234567' }));
      expect(res.status).toBe(400);
    });

    it('số điện thoại không phải 9–11 chữ số → 400', async () => {
      await register(tenantBody({ phone: '12345678' })).expect(400);
      await register(tenantBody({ phone: '090123456789' })).expect(400);
      await register(tenantBody({ phone: '09012345a7' })).expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await register(tenantBody()).expect(201);
    });

    it('đúng mật khẩu → 200 + token + user', async () => {
      const res = await login('THUE@example.com', PASSWORD);
      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user.email).toBe('thue@example.com');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('sai mật khẩu → 401', async () => {
      const res = await login('thue@example.com', 'saimatkhau');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Email hoặc mật khẩu không đúng');
    });

    it('email không tồn tại → 401', async () => {
      const res = await login('khongco@example.com', PASSWORD);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Email hoặc mật khẩu không đúng');
    });

    it('tài khoản bị khoá → 403', async () => {
      await app
        .get(DataSource)
        .query(`UPDATE "user" SET "isLocked" = true WHERE email = $1`, [
          'thue@example.com',
        ]);
      const res = await login('thue@example.com', PASSWORD);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Tài khoản đã bị khoá');
    });

    it('5 lần sai rồi lần 6 (kể cả đúng mật khẩu) → 429', async () => {
      const email = 'gioihan@example.com';
      await register(tenantBody({ email })).expect(201);
      for (let i = 0; i < 5; i++) {
        await login(email, 'saimatkhau').expect(401);
      }
      const res = await login(email.toUpperCase(), PASSWORD);
      expect(res.status).toBe(429);
      expect(res.body.message).toBe(
        'Bạn nhập sai quá nhiều lần, thử lại sau 15 phút',
      );
    });
  });

  describe('GET /api/auth/me', () => {
    it('có token → PublicUser', async () => {
      const reg = await register(tenantBody()).expect(201);
      const res = await request(http)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(reg.body.user);
    });

    it('không có token → 401', async () => {
      await request(http).get('/api/auth/me').expect(401);
    });

    it('bị khoá trong DB thì token cũ → 401', async () => {
      const reg = await register(tenantBody()).expect(201);
      await app
        .get(DataSource)
        .query(`UPDATE "user" SET "isLocked" = true WHERE id = $1`, [
          reg.body.user.id,
        ]);
      await request(http)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.accessToken}`)
        .expect(401);
    });
  });

  describe('PATCH /api/auth/password', () => {
    let token: string;

    beforeEach(async () => {
      const reg = await register(tenantBody()).expect(201);
      token = reg.body.accessToken;
    });

    it('sai mật khẩu hiện tại → 400', async () => {
      const res = await request(http)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'saimatkhau', newPassword: 'matkhaumoi1' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mật khẩu hiện tại không đúng');
    });

    it('đúng → 204, đăng nhập bằng mật khẩu mới được, mật khẩu cũ thì không', async () => {
      await request(http)
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: PASSWORD, newPassword: 'matkhaumoi1' })
        .expect(204);
      await login('thue@example.com', 'matkhaumoi1').expect(200);
      await login('thue@example.com', PASSWORD).expect(401);
    });

    it('không có token → 401', async () => {
      await request(http)
        .patch('/api/auth/password')
        .send({ currentPassword: PASSWORD, newPassword: 'matkhaumoi1' })
        .expect(401);
    });
  });
});
