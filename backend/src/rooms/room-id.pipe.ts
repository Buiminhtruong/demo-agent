import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { PHOTO_NOT_FOUND, ROOM_NOT_FOUND } from './my-rooms.service';

const MAX_INT = 2_147_483_647;

// id trên URL: không phải số nguyên dương hợp lệ → 404 (như bản ghi không tồn tại).
function parseId(value: string, notFound: string): number {
  if (!/^\d{1,10}$/.test(value)) throw new NotFoundException(notFound);
  const id = Number(value);
  if (id < 1 || id > MAX_INT) throw new NotFoundException(notFound);
  return id;
}

@Injectable()
export class ParseRoomIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    return parseId(value, ROOM_NOT_FOUND);
  }
}

@Injectable()
export class ParsePhotoIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    return parseId(value, PHOTO_NOT_FOUND);
  }
}
