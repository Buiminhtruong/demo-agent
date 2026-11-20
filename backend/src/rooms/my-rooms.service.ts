import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { District } from '../locations/district.entity';
import { Province } from '../locations/province.entity';
import {
  CreateRoomDto,
  MyRoomDto,
  PHOTO_ORDER_MISMATCH,
  RoomDto,
  UpdateRoomDto,
} from './dto/room.dto';
import {
  detectImageExt,
  MAX_PHOTOS,
  PhotoStorageService,
} from './photo-storage.service';
import { PHOTO_MESSAGES, UploadedPhoto } from './photo-upload.interceptor';
import { RoomPhoto } from './room-photo.entity';
import { Room } from './room.entity';

export const ROOM_NOT_FOUND = 'Không tìm thấy phòng';
export const PHOTO_NOT_FOUND = 'Không tìm thấy ảnh';

export function toRoomDto(room: Room): RoomDto {
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    price: room.price,
    area: room.area,
    provinceCode: room.provinceCode,
    provinceName: room.province.name,
    districtCode: room.districtCode,
    districtName: room.district.name,
    address: room.address,
    status: room.status,
    hiddenByOwner: room.hiddenByOwner,
    hiddenByAdmin: room.hiddenByAdmin,
    photos: [...(room.photos ?? [])]
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((p) => ({ id: p.id, url: `/uploads/${p.filename}` })),
    createdAt: room.createdAt,
  };
}

const RELATIONS = { province: true, district: true, photos: true } as const;

@Injectable()
export class MyRoomsService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Province)
    private readonly provinces: Repository<Province>,
    @InjectRepository(District)
    private readonly districts: Repository<District>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly storage: PhotoStorageService,
  ) {}

  async list(ownerId: number): Promise<MyRoomDto[]> {
    const rooms = await this.rooms.find({
      where: { ownerId, deletedAt: IsNull() },
      relations: RELATIONS,
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    // Task 10 nối số lịch hẹn đang chờ thật.
    return rooms.map((room) => ({
      ...toRoomDto(room),
      pendingAppointmentCount: 0,
    }));
  }

  async get(ownerId: number, roomId: number): Promise<RoomDto> {
    return toRoomDto(await this.findOwned(ownerId, roomId));
  }

  async create(ownerId: number, dto: CreateRoomDto): Promise<RoomDto> {
    await this.assertLocation(dto.provinceCode, dto.districtCode);
    const saved = await this.rooms.save(
      this.rooms.create({
        ownerId,
        title: dto.title,
        description: dto.description ?? '',
        price: dto.price,
        area: dto.area,
        provinceCode: dto.provinceCode,
        districtCode: dto.districtCode,
        address: dto.address,
      }),
    );
    return this.get(ownerId, saved.id);
  }

  async update(
    ownerId: number,
    roomId: number,
    dto: UpdateRoomDto,
  ): Promise<RoomDto> {
    const room = await this.findOwned(ownerId, roomId);
    if (dto.provinceCode !== undefined || dto.districtCode !== undefined) {
      // Chỉ gửi một trong hai → kiểm cặp với giá trị đang lưu.
      await this.assertLocation(
        dto.provinceCode ?? room.provinceCode,
        dto.districtCode ?? room.districtCode,
      );
    }

    const changes: Partial<Room> = {};
    for (const key of [
      'title',
      'description',
      'price',
      'area',
      'provinceCode',
      'districtCode',
      'address',
      'status',
      'hiddenByOwner',
    ] as const) {
      if (dto[key] !== undefined) {
        (changes as Record<string, unknown>)[key] = dto[key];
      }
    }
    if (Object.keys(changes).length > 0) {
      // update() theo cột (không save() thực thể đã nạp quan hệ — TypeORM sẽ
      // lấy mã tỉnh/quận từ quan hệ cũ thay vì giá trị mới).
      const result = await this.rooms.update(
        { id: roomId, ownerId, deletedAt: IsNull() },
        changes,
      );
      if (!result.affected) throw new NotFoundException(ROOM_NOT_FOUND);
    }
    return this.get(ownerId, roomId);
  }

  // Xoá mềm phòng của chủ trọ. Task 10 mở rộng: huỷ các lịch hẹn đang mở.
  async softDelete(ownerId: number, roomId: number): Promise<void> {
    const result = await this.rooms.update(
      { id: roomId, ownerId, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
    if (!result.affected) throw new NotFoundException(ROOM_NOT_FOUND);
  }

  // Thêm ảnh (tất cả hoặc không): kiểm loại + tổng số trước, ghi file, rồi
  // thêm dòng; thêm dòng hoặc commit lỗi thì xoá file vừa ghi.
  async addPhotos(
    ownerId: number,
    roomId: number,
    files: UploadedPhoto[] | undefined,
  ): Promise<RoomDto> {
    let written: string[] = [];
    try {
      await this.dataSource.transaction(async (manager) => {
        await this.lockOwned(manager, ownerId, roomId);
        if (!files || files.length === 0) {
          throw new BadRequestException(PHOTO_MESSAGES.none);
        }
        const typed = files.map((file) => {
          const ext = detectImageExt(file.buffer);
          if (!ext) throw new BadRequestException(PHOTO_MESSAGES.badType);
          return { buffer: file.buffer, ext };
        });

        const photos = manager.getRepository(RoomPhoto);
        const existing = await photos.find({ where: { roomId } });
        if (existing.length + typed.length > MAX_PHOTOS) {
          throw new BadRequestException(PHOTO_MESSAGES.tooMany);
        }
        const start = existing.reduce(
          (max, p) => Math.max(max, p.position + 1),
          0,
        );

        written = await this.storage.write(typed);
        await photos.insert(
          written.map((filename, i) => ({
            roomId,
            filename,
            position: start + i,
          })),
        );
      });
    } catch (err) {
      await this.storage.remove(written).catch(() => undefined);
      throw err;
    }
    return this.get(ownerId, roomId);
  }

  // Xoá một ảnh, đánh số lại 0..n-1, rồi xoá file (sau khi đã commit).
  async deletePhoto(
    ownerId: number,
    roomId: number,
    photoId: number,
  ): Promise<RoomDto> {
    const filename = await this.dataSource.transaction(async (manager) => {
      await this.lockOwned(manager, ownerId, roomId);
      const photos = manager.getRepository(RoomPhoto);
      const photo = await photos.findOneBy({ id: photoId, roomId });
      if (!photo) throw new NotFoundException(PHOTO_NOT_FOUND);
      await photos.delete({ id: photo.id });
      const rest = await photos.find({
        where: { roomId },
        order: { position: 'ASC', id: 'ASC' },
      });
      await this.renumber(manager, rest.map((p) => p.id), rest);
      return photo.filename;
    });
    await this.storage.remove([filename]);
    return this.get(ownerId, roomId);
  }

  // photoIds phải đúng tập ảnh hiện có của phòng (không thiếu, thừa, trùng).
  async reorderPhotos(
    ownerId: number,
    roomId: number,
    photoIds: number[],
  ): Promise<RoomDto> {
    await this.dataSource.transaction(async (manager) => {
      await this.lockOwned(manager, ownerId, roomId);
      const current = await manager
        .getRepository(RoomPhoto)
        .find({ where: { roomId } });
      const ids = new Set(current.map((p) => p.id));
      const matches =
        photoIds.length === current.length &&
        new Set(photoIds).size === photoIds.length &&
        photoIds.every((id) => ids.has(id));
      if (!matches) throw new BadRequestException(PHOTO_ORDER_MISMATCH);
      await this.renumber(manager, photoIds, current);
    });
    return this.get(ownerId, roomId);
  }

  // Đặt position = vị trí trong `order`; chỉ cập nhật dòng thay đổi.
  private async renumber(
    manager: EntityManager,
    order: number[],
    photos: RoomPhoto[],
  ): Promise<void> {
    const positionById = new Map(photos.map((p) => [p.id, p.position]));
    const repo = manager.getRepository(RoomPhoto);
    for (const [index, id] of order.entries()) {
      if (positionById.get(id) !== index) {
        await repo.update({ id }, { position: index });
      }
    }
  }

  // Khoá dòng phòng (FOR UPDATE) để các thao tác ảnh đồng thời trên cùng phòng
  // chạy lần lượt (không vượt 10 ảnh, không trùng vị trí).
  private async lockOwned(
    manager: EntityManager,
    ownerId: number,
    roomId: number,
  ): Promise<void> {
    const room = await manager
      .getRepository(Room)
      .createQueryBuilder('room')
      .setLock('pessimistic_write')
      .where('room.id = :roomId', { roomId })
      .andWhere('room.ownerId = :ownerId', { ownerId })
      .andWhere('room.deletedAt IS NULL')
      .getOne();
    if (!room) throw new NotFoundException(ROOM_NOT_FOUND);
  }

  // Một truy vấn lọc theo id + chủ + chưa xoá: phòng của người khác không
  // phân biệt được với phòng không tồn tại.
  private async findOwned(ownerId: number, roomId: number): Promise<Room> {
    const room = await this.rooms.findOne({
      where: { id: roomId, ownerId, deletedAt: IsNull() },
      relations: RELATIONS,
    });
    if (!room) throw new NotFoundException(ROOM_NOT_FOUND);
    return room;
  }

  private async assertLocation(
    provinceCode: string,
    districtCode: string,
  ): Promise<void> {
    const province = await this.provinces.findOneBy({ code: provinceCode });
    if (!province) throw new BadRequestException('Tỉnh/thành không hợp lệ');
    const district = await this.districts.findOneBy({ code: districtCode });
    if (!district || district.provinceCode !== provinceCode) {
      throw new BadRequestException(
        'Quận/huyện không thuộc tỉnh/thành đã chọn',
      );
    }
  }
}
