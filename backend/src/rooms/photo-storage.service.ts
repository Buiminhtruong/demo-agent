import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export type ImageExt = 'jpg' | 'png' | 'webp';

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// Nhận diện loại ảnh theo nội dung (magic bytes), không tin tên/MIME client gửi.
export function detectImageExt(buf: Buffer): ImageExt | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpg';
  }
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png';
  if (
    buf.length >= 12 &&
    buf.toString('latin1', 0, 4) === 'RIFF' &&
    buf.toString('latin1', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

// backend/uploads, tính từ thư mục mã nguồn (src/rooms hoặc dist/rooms),
// không theo process.cwd().
export function defaultUploadDir(): string {
  return resolve(__dirname, '..', '..', 'uploads');
}

export function uploadDir(): string {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  return fromEnv ? resolve(fromEnv) : defaultUploadDir();
}

@Injectable()
export class PhotoStorageService {
  readonly dir = uploadDir();

  // Ghi các ảnh đã kiểm tra; lỗi giữa chừng thì xoá các file đã ghi. Trả tên file.
  async write(files: { buffer: Buffer; ext: ImageExt }[]): Promise<string[]> {
    await mkdir(this.dir, { recursive: true });
    const written: string[] = [];
    try {
      for (const file of files) {
        const filename = `${randomUUID()}.${file.ext}`;
        await writeFile(join(this.dir, filename), file.buffer, { flag: 'wx' });
        written.push(filename);
      }
    } catch (err) {
      await this.remove(written).catch(() => undefined);
      throw err;
    }
    return written;
  }

  // Xoá file; file không còn thì bỏ qua.
  async remove(filenames: string[]): Promise<void> {
    for (const filename of filenames) {
      if (!filename || basename(filename) !== filename || filename.startsWith('.')) {
        throw new Error(`Tên file ảnh không hợp lệ: ${filename}`);
      }
      try {
        await unlink(join(this.dir, filename));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      }
    }
  }
}
