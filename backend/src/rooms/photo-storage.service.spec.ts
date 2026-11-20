import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  defaultUploadDir,
  detectImageExt,
  PhotoStorageService,
} from './photo-storage.service';

const bytes = (...xs: number[]) => Buffer.from(xs);

describe('detectImageExt', () => {
  it('nhận JPEG, PNG, WebP theo magic bytes', () => {
    expect(detectImageExt(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe('jpg');
    expect(
      detectImageExt(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)),
    ).toBe('png');
    expect(
      detectImageExt(Buffer.concat([Buffer.from('RIFF'), bytes(1, 2, 3, 4), Buffer.from('WEBPVP8 ')])),
    ).toBe('webp');
  });

  it('từ chối GIF, chữ, RIFF không phải WebP, buffer ngắn', () => {
    expect(detectImageExt(Buffer.from('GIF89a......'))).toBeNull();
    expect(detectImageExt(Buffer.from('xin chao, toi la chu'))).toBeNull();
    expect(
      detectImageExt(Buffer.concat([Buffer.from('RIFF'), bytes(1, 2, 3, 4), Buffer.from('WAVE')])),
    ).toBeNull();
    expect(detectImageExt(Buffer.from('RIFF'))).toBeNull();
    expect(detectImageExt(bytes(0xff, 0xd8))).toBeNull();
    expect(detectImageExt(Buffer.alloc(0))).toBeNull();
  });
});

describe('defaultUploadDir', () => {
  it('là backend/uploads, không phụ thuộc thư mục đang chạy', () => {
    expect(defaultUploadDir()).toBe(resolve(__dirname, '..', '..', 'uploads'));
  });
});

describe('PhotoStorageService', () => {
  let dir: string;
  let storage: PhotoStorageService;
  const saved = process.env.UPLOAD_DIR;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'photo-storage-'));
    process.env.UPLOAD_DIR = dir;
    storage = new PhotoStorageService();
  });

  afterEach(() => {
    process.env.UPLOAD_DIR = saved;
    rmSync(dir, { recursive: true, force: true });
  });

  it('ghi file tên UUID + đuôi, xoá được, xoá file không còn không lỗi', async () => {
    const [name] = await storage.write([{ buffer: Buffer.from('x'), ext: 'png' }]);
    expect(name).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(readdirSync(dir)).toEqual([name]);
    await storage.remove([name]);
    expect(readdirSync(dir)).toEqual([]);
    await expect(storage.remove([name])).resolves.toBeUndefined();
  });

  it('không nhận tên có đường dẫn khi xoá', async () => {
    await expect(storage.remove(['../x.png'])).rejects.toThrow();
  });
});
