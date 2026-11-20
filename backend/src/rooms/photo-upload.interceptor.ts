import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { Observable } from 'rxjs';
import { MAX_PHOTO_BYTES, MAX_PHOTOS } from './photo-storage.service';

export const PHOTO_FIELD = 'photos';

export const PHOTO_MESSAGES = {
  tooBig: 'Mỗi ảnh tối đa 5 MB',
  tooMany: `Tối đa ${MAX_PHOTOS} ảnh`,
  badType: 'Chỉ nhận ảnh JPG, PNG hoặc WebP',
  none: 'Vui lòng chọn ảnh',
  wrongField: `Ảnh phải gửi trong trường "${PHOTO_FIELD}"`,
  invalid: 'Dữ liệu tải ảnh không hợp lệ',
} as const;

export interface UploadedPhoto {
  buffer: Buffer;
  size: number;
}

function toHttpError(err: unknown): BadRequestException {
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return new BadRequestException(PHOTO_MESSAGES.tooBig);
      case 'LIMIT_FILE_COUNT':
        return new BadRequestException(PHOTO_MESSAGES.tooMany);
      case 'LIMIT_UNEXPECTED_FILE':
        return new BadRequestException(PHOTO_MESSAGES.wrongField);
    }
  }
  return new BadRequestException(PHOTO_MESSAGES.invalid);
}

// Đọc multipart vào bộ nhớ (chưa ghi đĩa): service kiểm tra xong cả lô mới ghi.
// Tự dùng multer để đổi lỗi giới hạn sang 400 tiếng Việt (FilesInterceptor của
// Nest trả 413 "File too large").
@Injectable()
export class PhotoUploadInterceptor implements NestInterceptor {
  private readonly upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_PHOTO_BYTES,
      files: MAX_PHOTOS,
      fields: 10,
      parts: MAX_PHOTOS + 10,
    },
  }).array(PHOTO_FIELD);

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    await new Promise<void>((resolve, reject) =>
      this.upload(
        http.getRequest<Request>(),
        http.getResponse<Response>(),
        (err?: unknown) => (err ? reject(toHttpError(err)) : resolve()),
      ),
    );
    return next.handle();
  }
}
