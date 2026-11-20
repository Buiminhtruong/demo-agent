import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { District } from '../locations/district.entity';
import { Province } from '../locations/province.entity';
import {
  CreateRoomDto,
  MyRoomDto,
  RoomDto,
  UpdateRoomDto,
} from './dto/room.dto';
import { Room } from './room.entity';

export const ROOM_NOT_FOUND = 'Không tìm thấy phòng';

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
