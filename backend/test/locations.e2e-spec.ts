import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { LocationsService } from '../src/locations/locations.service';
import { createTestApp, resetDb } from './helpers';

describe('Locations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    await app.get(LocationsService).seedFromFile();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/locations/provinces: có Thành phố Hồ Chí Minh, sắp xếp theo tên', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/locations/provinces',
    );
    expect(res.status).toBe(200);
    const names: string[] = res.body.map((p: { name: string }) => p.name);
    expect(res.body).toContainEqual({
      code: '79',
      name: 'Thành phố Hồ Chí Minh',
    });
    expect(res.body).toContainEqual({ code: '01', name: 'Thành phố Hà Nội' });
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'vi')));
  });

  it('GET /api/locations/provinces/79/districts: có Quận Bình Thạnh (mã 765), sắp xếp theo tên', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/locations/provinces/79/districts',
    );
    expect(res.status).toBe(200);
    expect(res.body).toContainEqual({
      code: '765',
      name: 'Quận Bình Thạnh',
      provinceCode: '79',
    });
    expect(
      res.body.every((d: { provinceCode: string }) => d.provinceCode === '79'),
    ).toBe(true);
    const names: string[] = res.body.map((d: { name: string }) => d.name);
    expect(names).toEqual(
      [...names].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })),
    );
    expect(names.indexOf('Quận 2')).toBeLessThan(names.indexOf('Quận 10'));
  });

  it('mã tỉnh không tồn tại trả 404', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/locations/provinces/xx/districts',
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Không tìm thấy tỉnh/thành');
  });

  it('nạp dữ liệu lại không tạo trùng', async () => {
    const before = await request(app.getHttpServer()).get(
      '/api/locations/provinces/79/districts',
    );
    await app.get(LocationsService).seedFromFile();
    const after = await request(app.getHttpServer()).get(
      '/api/locations/provinces/79/districts',
    );
    expect(after.body).toHaveLength(before.body.length);
    const provinces = await request(app.getHttpServer()).get(
      '/api/locations/provinces',
    );
    const codes = provinces.body.map((p: { code: string }) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
