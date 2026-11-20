import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { LocationsService } from '../src/locations/locations.service';
import { createTestApp, resetDb } from './helpers';

const PASSWORD = 'matkhau123';

function roomBody(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Phòng trọ gần chợ Bà Chiểu',
    description: 'Phòng sạch sẽ, có gác lửng.',
    price: 3500000,
    area: 20,
    provinceCode: '79',
    districtCode: '765',
    address: '12 Lê Quang Định, Phường 14',
    ...overrides,
  };
}

describe('Phòng của tôi (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let tokenA: string;
  let tokenB: string;
  let tokenTenant: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
  });

  beforeEach(async () => {
    await resetDb(app);
    await app.get(LocationsService).seedFromFile();
    tokenA = await registerUser('a@example.com', 'landlord');
    tokenB = await registerUser('b@example.com', 'landlord');
    tokenTenant = await registerUser('t@example.com', 'tenant');
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerUser(email: string, role: string): Promise<string> {
    const res = await request(http)
      .post('/api/auth/register')
      .send({
        email,
        password: PASSWORD,
        fullName: 'Người Dùng',
        phone: '0901234567',
        role,
      })
      .expect(201);
    return res.body.accessToken;
  }

  const create = (token: string, body: Record<string, unknown> = roomBody()) =>
    request(http)
      .post('/api/my/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const get = (token: string, id: number | string) =>
    request(http)
      .get(`/api/my/rooms/${id}`)
      .set('Authorization', `Bearer ${token}`);
  const list = (token: string) =>
    request(http).get('/api/my/rooms').set('Authorization', `Bearer ${token}`);
  const patch = (token: string, id: number | string, body: Record<string, unknown>) =>
    request(http)
      .patch(`/api/my/rooms/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const del = (token: string, id: number | string) =>
    request(http)
      .delete(`/api/my/rooms/${id}`)
      .set('Authorization', `Bearer ${token}`);

  describe('POST /api/my/rooms', () => {
    it('tạo phòng: 201, trả RoomDto có tên tỉnh/quận, ảnh rỗng, đã trim chuỗi', async () => {
      const res = await create(
        tokenA,
        roomBody({ title: '  Phòng trọ gần chợ Bà Chiểu  ', address: ' 12 Lê Quang Định, Phường 14 ' }),
      );
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(Number),
        title: 'Phòng trọ gần chợ Bà Chiểu',
        description: 'Phòng sạch sẽ, có gác lửng.',
        price: 3500000,
        area: 20,
        provinceCode: '79',
        provinceName: 'Thành phố Hồ Chí Minh',
        districtCode: '765',
        districtName: 'Quận Bình Thạnh',
        address: '12 Lê Quang Định, Phường 14',
        status: 'available',
        hiddenByOwner: false,
        hiddenByAdmin: false,
        photos: [],
        createdAt: expect.any(String),
      });
    });

    it('tenant gọi → 403', async () => {
      const res = await create(tokenTenant);
      expect(res.status).toBe(403);
    });

    it('chưa đăng nhập → 401', async () => {
      await request(http).post('/api/my/rooms').send(roomBody()).expect(401);
    });

    it('quận/huyện không thuộc tỉnh/thành → 400', async () => {
      // 001 = Quận Ba Đình (Hà Nội), không thuộc 79.
      const res = await create(tokenA, roomBody({ districtCode: '001' }));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Quận/huyện không thuộc tỉnh/thành đã chọn');
    });

    it('quận/huyện không tồn tại → 400', async () => {
      const res = await create(tokenA, roomBody({ districtCode: '99999' }));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Quận/huyện không thuộc tỉnh/thành đã chọn');
    });

    it('tỉnh/thành không tồn tại → 400', async () => {
      const res = await create(tokenA, roomBody({ provinceCode: 'xx' }));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Tỉnh/thành không hợp lệ');
    });

    it('giá 0, âm, lẻ hoặc là chuỗi → 400', async () => {
      for (const price of [0, -100, 1.5, '3500000']) {
        const res = await create(tokenA, roomBody({ price }));
        expect(res.status).toBe(400);
        expect(res.body.message).toEqual(['Giá phải là số nguyên lớn hơn 0']);
      }
    });

    it('giá quá lớn (tràn cột integer) → 400, không phải 500', async () => {
      const res = await create(tokenA, roomBody({ price: 1e12 }));
      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(['Giá tối đa 2.000.000.000 đồng']);
    });

    it('diện tích 0 hoặc âm → 400', async () => {
      for (const area of [0, -5]) {
        const res = await create(tokenA, roomBody({ area }));
        expect(res.status).toBe(400);
        expect(res.body.message).toEqual(['Diện tích phải là số nguyên lớn hơn 0']);
      }
    });

    it('các thông báo lỗi khác bằng tiếng Việt', async () => {
      const short = await create(tokenA, roomBody({ title: '  abc  ' }));
      expect(short.body.message).toEqual(['Tiêu đề từ 5 đến 120 ký tự']);
      const long = await create(tokenA, roomBody({ title: 'a'.repeat(121) }));
      expect(long.body.message).toEqual(['Tiêu đề từ 5 đến 120 ký tự']);
      const desc = await create(tokenA, roomBody({ description: 'a'.repeat(5001) }));
      expect(desc.body.message).toEqual(['Mô tả tối đa 5000 ký tự']);
      const noAddr = await create(tokenA, roomBody({ address: '   ' }));
      expect(noAddr.body.message).toEqual(['Vui lòng nhập địa chỉ']);
      const missingAddr = await create(tokenA, roomBody({ address: undefined }));
      expect(missingAddr.body.message).toEqual(['Vui lòng nhập địa chỉ']);
      const longAddr = await create(tokenA, roomBody({ address: 'a'.repeat(256) }));
      expect(longAddr.body.message).toEqual(['Địa chỉ tối đa 255 ký tự']);
    });

    it('không cho đặt hiddenByAdmin / ownerId qua body', async () => {
      const res = await create(tokenA, roomBody({ hiddenByAdmin: true, ownerId: 999 }));
      expect(res.status).toBe(201);
      expect(res.body.hiddenByAdmin).toBe(false);
    });
  });

  describe('GET /api/my/rooms', () => {
    it('chỉ phòng của mình, mới nhất trước, có pendingAppointmentCount = 0, bỏ phòng đã xoá', async () => {
      const r1 = (await create(tokenA, roomBody({ title: 'Phòng số một' }))).body;
      const r2 = (await create(tokenA, roomBody({ title: 'Phòng số hai' }))).body;
      const r3 = (await create(tokenA, roomBody({ title: 'Phòng số ba' }))).body;
      await create(tokenB, roomBody({ title: 'Phòng của B' })).expect(201);
      await del(tokenA, r2.id).expect(204);

      const res = await list(tokenA);
      expect(res.status).toBe(200);
      expect(res.body.map((r: { id: number }) => r.id)).toEqual([r3.id, r1.id]);
      expect(res.body[0].pendingAppointmentCount).toBe(0);
      expect(res.body[0].provinceName).toBe('Thành phố Hồ Chí Minh');
    });

    it('tenant gọi → 403', async () => {
      await list(tokenTenant).expect(403);
    });
  });

  describe('GET /api/my/rooms/:id', () => {
    it('ảnh: url = /uploads/<filename>, sắp theo position', async () => {
      const room = (await create(tokenA)).body;
      await app.get(DataSource).query(
        `INSERT INTO room_photo ("roomId", filename, position)
         VALUES ($1, 'b.jpg', 2), ($1, 'a.jpg', 1)`,
        [room.id],
      );
      const res = await get(tokenA, room.id);
      expect(res.body.photos.map((p: { url: string }) => p.url)).toEqual([
        '/uploads/a.jpg',
        '/uploads/b.jpg',
      ]);
      expect(res.body.photos[0].id).toEqual(expect.any(Number));
    });

    it('chủ phòng xem được', async () => {
      const room = (await create(tokenA)).body;
      const res = await get(tokenA, room.id);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(room);
    });

    it('phòng của chủ trọ khác, không tồn tại, id sai dạng → 404', async () => {
      const room = (await create(tokenA)).body;
      for (const id of [room.id, 99999, 'abc', '99999999999']) {
        const res = await get(tokenB, id);
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Không tìm thấy phòng');
      }
    });

    it('tenant gọi → 403', async () => {
      const room = (await create(tokenA)).body;
      await get(tokenTenant, room.id).expect(403);
    });
  });

  describe('PATCH /api/my/rooms/:id', () => {
    it('sửa một phần: các trường khác giữ nguyên', async () => {
      const room = (await create(tokenA)).body;
      const res = await patch(tokenA, room.id, { title: '  Tiêu đề mới đây  ', price: 4000000 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ...room,
        title: 'Tiêu đề mới đây',
        price: 4000000,
      });
      expect((await get(tokenA, room.id)).body.title).toBe('Tiêu đề mới đây');
    });

    it('ẩn / hiện tin và đánh dấu đã cho thuê', async () => {
      const room = (await create(tokenA)).body;
      const hidden = await patch(tokenA, room.id, { hiddenByOwner: true });
      expect(hidden.status).toBe(200);
      expect(hidden.body.hiddenByOwner).toBe(true);
      const rented = await patch(tokenA, room.id, { status: 'rented' });
      expect(rented.body.status).toBe('rented');
      expect(rented.body.hiddenByOwner).toBe(true);
      const shown = await patch(tokenA, room.id, { hiddenByOwner: false, status: 'available' });
      expect(shown.body.hiddenByOwner).toBe(false);
      expect(shown.body.status).toBe('available');
    });

    it('status hoặc hiddenByOwner sai → 400', async () => {
      const room = (await create(tokenA)).body;
      const st = await patch(tokenA, room.id, { status: 'sold' });
      expect(st.status).toBe(400);
      expect(st.body.message).toEqual(['Tình trạng không hợp lệ']);
      await patch(tokenA, room.id, { hiddenByOwner: 'yes' }).expect(400);
    });

    it('áp dụng cùng quy tắc: giá 0, tiêu đề ngắn, null → 400', async () => {
      const room = (await create(tokenA)).body;
      const price = await patch(tokenA, room.id, { price: 0 });
      expect(price.status).toBe(400);
      expect(price.body.message).toEqual(['Giá phải là số nguyên lớn hơn 0']);
      const title = await patch(tokenA, room.id, { title: 'abc' });
      expect(title.body.message).toEqual(['Tiêu đề từ 5 đến 120 ký tự']);
      await patch(tokenA, room.id, { title: null }).expect(400);
      await patch(tokenA, room.id, { address: null }).expect(400);
    });

    it('chỉ gửi districtCode: kiểm theo tỉnh đã lưu', async () => {
      const room = (await create(tokenA)).body;
      const bad = await patch(tokenA, room.id, { districtCode: '001' });
      expect(bad.status).toBe(400);
      expect(bad.body.message).toBe('Quận/huyện không thuộc tỉnh/thành đã chọn');
      // 760 = Quận 1 (TP.HCM).
      const ok = await patch(tokenA, room.id, { districtCode: '760' });
      expect(ok.status).toBe(200);
      expect(ok.body.districtCode).toBe('760');
      expect(ok.body.districtName).toBe('Quận 1');
    });

    it('chỉ gửi provinceCode: kiểm theo quận đã lưu', async () => {
      const room = (await create(tokenA)).body;
      const bad = await patch(tokenA, room.id, { provinceCode: '01' });
      expect(bad.status).toBe(400);
      expect(bad.body.message).toBe('Quận/huyện không thuộc tỉnh/thành đã chọn');
      const ok = await patch(tokenA, room.id, { provinceCode: '01', districtCode: '001' });
      expect(ok.status).toBe(200);
      expect(ok.body.provinceName).toBe('Thành phố Hà Nội');
      expect(ok.body.districtName).toBe('Quận Ba Đình');
    });

    it('chủ trọ B sửa phòng của A → 404, phòng không đổi', async () => {
      const room = (await create(tokenA)).body;
      const res = await patch(tokenB, room.id, { title: 'Bị chiếm quyền rồi' });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy phòng');
      expect((await get(tokenA, room.id)).body.title).toBe(room.title);
    });

    it('tenant gọi → 403', async () => {
      const room = (await create(tokenA)).body;
      await patch(tokenTenant, room.id, { title: 'Tenant sửa phòng' }).expect(403);
    });
  });

  describe('DELETE /api/my/rooms/:id', () => {
    it('xoá mềm: 204, sau đó GET/PATCH/DELETE → 404, dòng vẫn còn trong DB', async () => {
      const room = (await create(tokenA)).body;
      const res = await del(tokenA, room.id);
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});

      await get(tokenA, room.id).expect(404);
      await patch(tokenA, room.id, { title: 'Sửa phòng đã xoá' }).expect(404);
      await del(tokenA, room.id).expect(404);

      const [row] = await app
        .get(DataSource)
        .query('SELECT "deletedAt" FROM room WHERE id = $1', [room.id]);
      expect(row.deletedAt).not.toBeNull();
    });

    it('chủ trọ B xoá phòng của A → 404, phòng vẫn còn', async () => {
      const room = (await create(tokenA)).body;
      const res = await del(tokenB, room.id);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy phòng');
      await get(tokenA, room.id).expect(200);
    });

    it('tenant gọi → 403', async () => {
      const room = (await create(tokenA)).body;
      await del(tokenTenant, room.id).expect(403);
    });
  });
});
