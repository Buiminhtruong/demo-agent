import { INestApplication } from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { LocationsService } from '../src/locations/locations.service';
import { createTestApp, resetDb } from './helpers';

const PASSWORD = 'matkhau123';
const UPLOAD_DIR = process.env.UPLOAD_DIR as string;

// Ảnh 1x1 thật, sinh sẵn trong test.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);
const WEBP = Buffer.from(
  'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
  'base64',
);
const GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);
const FAKE_PNG = Buffer.from('đây không phải ảnh, chỉ là chữ');

interface Upload {
  buffer: Buffer;
  name: string;
  type?: string;
}
const png = (name = 'anh.png'): Upload => ({ buffer: PNG, name, type: 'image/png' });

function uploadedFiles(): string[] {
  return existsSync(UPLOAD_DIR) ? readdirSync(UPLOAD_DIR) : [];
}

describe('Ảnh phòng (e2e)', () => {
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
    rmSync(UPLOAD_DIR, { recursive: true, force: true });
    await resetDb(app);
    await app.get(LocationsService).seedFromFile();
    tokenA = await registerUser('a@example.com', 'landlord');
    tokenB = await registerUser('b@example.com', 'landlord');
    tokenTenant = await registerUser('t@example.com', 'tenant');
  });

  afterAll(async () => {
    await app.close();
    rmSync(UPLOAD_DIR, { recursive: true, force: true });
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

  async function createRoom(token: string): Promise<{ id: number }> {
    const res = await request(http)
      .post('/api/my/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Phòng trọ gần chợ Bà Chiểu',
        price: 3500000,
        area: 20,
        provinceCode: '79',
        districtCode: '765',
        address: '12 Lê Quang Định, Phường 14',
      })
      .expect(201);
    return res.body;
  }

  const upload = (
    token: string | null,
    roomId: number | string,
    files: Upload[],
    field = 'photos',
  ) => {
    let req = request(http).post(`/api/my/rooms/${roomId}/photos`);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    for (const f of files) {
      req = req.attach(field, f.buffer, {
        filename: f.name,
        contentType: f.type ?? 'application/octet-stream',
      });
    }
    return req;
  };
  const delPhoto = (token: string, roomId: number | string, photoId: number | string) =>
    request(http)
      .delete(`/api/my/rooms/${roomId}/photos/${photoId}`)
      .set('Authorization', `Bearer ${token}`);
  const reorder = (token: string, roomId: number | string, body: unknown) =>
    request(http)
      .put(`/api/my/rooms/${roomId}/photos/order`)
      .set('Authorization', `Bearer ${token}`)
      .send(body as object);

  async function dbPhotos(roomId: number) {
    return app
      .get(DataSource)
      .query(
        'SELECT id, filename, position FROM room_photo WHERE "roomId" = $1 ORDER BY position, id',
        [roomId],
      ) as Promise<{ id: number; filename: string; position: number }[]>;
  }

  const fileOf = (url: string) => url.replace('/uploads/', '');

  describe('POST /api/my/rooms/:id/photos', () => {
    it('tải 2 ảnh PNG → 201, thứ tự 0,1, tên file UUID.png, file có trên đĩa và tải về được', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, [png('mot.png'), png('hai.png')]);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(room.id);
      expect(res.body.photos).toHaveLength(2);
      for (const p of res.body.photos) {
        expect(p.url).toMatch(
          /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
        );
        expect(readFileSync(join(UPLOAD_DIR, fileOf(p.url)))).toEqual(PNG);
      }
      const rows = await dbPhotos(room.id);
      expect(rows.map((r) => r.position)).toEqual([0, 1]);
      expect(rows.map((r) => r.id)).toEqual(res.body.photos.map((p: { id: number }) => p.id));

      const served = await request(http).get(res.body.photos[0].url).buffer(true);
      expect(served.status).toBe(200);
      expect(served.headers['content-type']).toBe('image/png');
      expect(served.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.from(served.body)).toEqual(PNG);
    });

    it('JPEG và WebP nhận diện theo nội dung: đuôi file theo loại thật, không theo tên gửi lên', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, [
        { buffer: JPEG, name: 'anh.png', type: 'image/png' },
        { buffer: WEBP, name: 'anh', type: 'application/octet-stream' },
      ]);
      expect(res.status).toBe(201);
      expect(res.body.photos[0].url).toMatch(/\.jpg$/);
      expect(res.body.photos[1].url).toMatch(/\.webp$/);
    });

    it('file .png nhưng nội dung là chữ → 400, không lưu gì', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, [
        { buffer: FAKE_PNG, name: 'gia.png', type: 'image/png' },
      ]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Chỉ nhận ảnh JPG, PNG hoặc WebP');
      expect(uploadedFiles()).toEqual([]);
      expect(await dbPhotos(room.id)).toEqual([]);
    });

    it('file .gif → 400', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, [
        { buffer: GIF, name: 'dong.gif', type: 'image/gif' },
      ]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    });

    it('một ảnh hỏng trong lô → cả lô bị từ chối, không lưu file nào', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, [
        png(),
        { buffer: GIF, name: 'dong.gif', type: 'image/gif' },
      ]);
      expect(res.status).toBe(400);
      expect(uploadedFiles()).toEqual([]);
      expect(await dbPhotos(room.id)).toEqual([]);
    });

    it('ảnh lớn hơn 5 MB → 400 tiếng Việt, không lưu gì', async () => {
      const room = await createRoom(tokenA);
      const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
      const res = await upload(tokenA, room.id, [{ buffer: big, name: 'to.png', type: 'image/png' }]);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Mỗi ảnh tối đa 5 MB');
      expect(uploadedFiles()).toEqual([]);
      expect(await dbPhotos(room.id)).toEqual([]);
    });

    it('ảnh đúng 5 MB vẫn nhận', async () => {
      const room = await createRoom(tokenA);
      const exact = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 - PNG.length)]);
      const res = await upload(tokenA, room.id, [{ buffer: exact, name: 'vua.png', type: 'image/png' }]);
      expect(res.status).toBe(201);
    });

    it('11 ảnh trong một lần → 400 "Tối đa 10 ảnh", không lưu gì', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, Array.from({ length: 11 }, () => png()));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Tối đa 10 ảnh');
      expect(uploadedFiles()).toEqual([]);
      expect(await dbPhotos(room.id)).toEqual([]);
    });

    it('đã có 9 ảnh: thêm 2 → 400 (không lưu), thêm 1 → đủ 10, thêm nữa → 400', async () => {
      const room = await createRoom(tokenA);
      await upload(tokenA, room.id, Array.from({ length: 9 }, () => png())).expect(201);

      const over = await upload(tokenA, room.id, [png(), png()]);
      expect(over.status).toBe(400);
      expect(over.body.message).toBe('Tối đa 10 ảnh');
      expect(uploadedFiles()).toHaveLength(9);
      expect(await dbPhotos(room.id)).toHaveLength(9);

      const ok = await upload(tokenA, room.id, [png()]);
      expect(ok.status).toBe(201);
      expect(ok.body.photos).toHaveLength(10);

      const eleventh = await upload(tokenA, room.id, [png()]);
      expect(eleventh.status).toBe(400);
      expect(eleventh.body.message).toBe('Tối đa 10 ảnh');
    });

    it('ảnh mới nối sau vị trí lớn nhất hiện có', async () => {
      const room = await createRoom(tokenA);
      await upload(tokenA, room.id, [png(), png()]).expect(201);
      await app
        .get(DataSource)
        .query('UPDATE room_photo SET position = position + 5 WHERE "roomId" = $1', [room.id]);
      const res = await upload(tokenA, room.id, [png()]);
      expect(res.status).toBe(201);
      const rows = await dbPhotos(room.id);
      expect(rows.map((r) => r.position)).toEqual([5, 6, 7]);
      expect(res.body.photos[2].id).toBe(rows[2].id);
    });

    it('không có file → 400 "Vui lòng chọn ảnh"', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, []);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Vui lòng chọn ảnh');
    });

    it('sai tên trường → 400, không lưu gì', async () => {
      const room = await createRoom(tokenA);
      const res = await upload(tokenA, room.id, [png()], 'anh');
      expect(res.status).toBe(400);
      expect(uploadedFiles()).toEqual([]);
    });

    it('chủ trọ khác / phòng không tồn tại / phòng đã xoá → 404, không lưu gì', async () => {
      const room = await createRoom(tokenA);
      const b = await upload(tokenB, room.id, [png()]);
      expect(b.status).toBe(404);
      expect(b.body.message).toBe('Không tìm thấy phòng');
      await upload(tokenA, 99999, [png()]).expect(404);
      await upload(tokenA, 'abc', [png()]).expect(404);
      await request(http)
        .delete(`/api/my/rooms/${room.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(204);
      await upload(tokenA, room.id, [png()]).expect(404);
      expect(uploadedFiles()).toEqual([]);
    });

    it('tenant → 403, chưa đăng nhập → 401', async () => {
      const room = await createRoom(tokenA);
      await upload(tokenTenant, room.id, [png()]).expect(403);
      await upload(null, room.id, [png()]).expect(401);
      expect(uploadedFiles()).toEqual([]);
    });
  });

  describe('PUT /api/my/rooms/:id/photos/order', () => {
    it('đổi thứ tự → RoomDto theo thứ tự mới, position 0..n-1', async () => {
      const room = await createRoom(tokenA);
      const up = await upload(tokenA, room.id, [png(), png(), png()]);
      const [p1, p2, p3] = up.body.photos.map((p: { id: number }) => p.id);

      const res = await reorder(tokenA, room.id, { photoIds: [p3, p1, p2] });
      expect(res.status).toBe(200);
      expect(res.body.photos.map((p: { id: number }) => p.id)).toEqual([p3, p1, p2]);
      const rows = await dbPhotos(room.id);
      expect(rows.map((r) => [r.id, r.position])).toEqual([
        [p3, 0],
        [p1, 1],
        [p2, 2],
      ]);
    });

    it('thiếu, thừa, trùng, ảnh của phòng khác → 400 "Danh sách ảnh không khớp", thứ tự giữ nguyên', async () => {
      const room = await createRoom(tokenA);
      const other = await createRoom(tokenA);
      const up = await upload(tokenA, room.id, [png(), png()]);
      const otherUp = await upload(tokenA, other.id, [png()]);
      const [p1, p2] = up.body.photos.map((p: { id: number }) => p.id);
      const q = otherUp.body.photos[0].id;

      for (const photoIds of [[p1], [p1, p2, 99999], [p1, p1], [p1, p1, p2], [p1, q], [p2, p1, q], []]) {
        const res = await reorder(tokenA, room.id, { photoIds });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Danh sách ảnh không khớp');
      }
      expect((await dbPhotos(room.id)).map((r) => r.id)).toEqual([p1, p2]);
    });

    it('photoIds sai kiểu → 400', async () => {
      const room = await createRoom(tokenA);
      await upload(tokenA, room.id, [png()]).expect(201);
      for (const body of [{}, { photoIds: 'abc' }, { photoIds: ['1'] }, { photoIds: [1.5] }]) {
        await reorder(tokenA, room.id, body).expect(400);
      }
    });

    it('chủ trọ khác → 404', async () => {
      const room = await createRoom(tokenA);
      const up = await upload(tokenA, room.id, [png()]);
      const res = await reorder(tokenB, room.id, { photoIds: [up.body.photos[0].id] });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy phòng');
    });
  });

  describe('DELETE /api/my/rooms/:id/photos/:photoId', () => {
    it('xoá ảnh → RoomDto còn lại, đánh số lại 0..n-1, file bị xoá', async () => {
      const room = await createRoom(tokenA);
      const up = await upload(tokenA, room.id, [png(), png(), png()]);
      const [p1, p2, p3] = up.body.photos;

      const res = await delPhoto(tokenA, room.id, p2.id);
      expect(res.status).toBe(200);
      expect(res.body.photos.map((p: { id: number }) => p.id)).toEqual([p1.id, p3.id]);
      const rows = await dbPhotos(room.id);
      expect(rows.map((r) => [r.id, r.position])).toEqual([
        [p1.id, 0],
        [p3.id, 1],
      ]);
      expect(existsSync(join(UPLOAD_DIR, fileOf(p2.url)))).toBe(false);
      expect(existsSync(join(UPLOAD_DIR, fileOf(p1.url)))).toBe(true);
      await request(http).get(p2.url).expect(404);
    });

    it('file đã mất trên đĩa vẫn xoá được ảnh', async () => {
      const room = await createRoom(tokenA);
      const up = await upload(tokenA, room.id, [png()]);
      rmSync(join(UPLOAD_DIR, fileOf(up.body.photos[0].url)));
      const res = await delPhoto(tokenA, room.id, up.body.photos[0].id);
      expect(res.status).toBe(200);
      expect(res.body.photos).toEqual([]);
    });

    it('ảnh của phòng khác, id không tồn tại, id sai dạng → 404 "Không tìm thấy ảnh"', async () => {
      const room = await createRoom(tokenA);
      const other = await createRoom(tokenA);
      const otherUp = await upload(tokenA, other.id, [png()]);
      for (const photoId of [otherUp.body.photos[0].id, 99999, 'abc', '99999999999']) {
        const res = await delPhoto(tokenA, room.id, photoId);
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Không tìm thấy ảnh');
      }
      expect(await dbPhotos(other.id)).toHaveLength(1);
      expect(uploadedFiles()).toHaveLength(1);
    });

    it('chủ trọ khác → 404 phòng, ảnh còn nguyên', async () => {
      const room = await createRoom(tokenA);
      const up = await upload(tokenA, room.id, [png()]);
      const res = await delPhoto(tokenB, room.id, up.body.photos[0].id);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Không tìm thấy phòng');
      expect(await dbPhotos(room.id)).toHaveLength(1);
      expect(uploadedFiles()).toHaveLength(1);
    });
  });

  describe('Phục vụ /uploads', () => {
    it('xoá mềm phòng giữ file ảnh', async () => {
      const room = await createRoom(tokenA);
      await upload(tokenA, room.id, [png()]).expect(201);
      await request(http)
        .delete(`/api/my/rooms/${room.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(204);
      expect(uploadedFiles()).toHaveLength(1);
    });

    it('không liệt kê thư mục, không trả dotfile', async () => {
      mkdirSync(UPLOAD_DIR, { recursive: true });
      writeFileSync(join(UPLOAD_DIR, '.an'), 'bi mat');
      await request(http).get('/uploads/').expect(404);
      const dot = await request(http).get('/uploads/.an');
      expect(dot.status).not.toBe(200);
    });
  });
});
