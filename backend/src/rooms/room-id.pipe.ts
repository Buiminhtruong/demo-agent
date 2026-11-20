import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { ROOM_NOT_FOUND } from './my-rooms.service';

const MAX_INT = 2_147_483_647;

// id phòng trên URL: không phải số nguyên dương hợp lệ → 404 (như phòng không tồn tại).
@Injectable()
export class ParseRoomIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^\d{1,10}$/.test(value)) throw new NotFoundException(ROOM_NOT_FOUND);
    const id = Number(value);
    if (id < 1 || id > MAX_INT) throw new NotFoundException(ROOM_NOT_FOUND);
    return id;
  }
}
