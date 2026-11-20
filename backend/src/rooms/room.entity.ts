import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { District } from '../locations/district.entity';
import { Province } from '../locations/province.entity';
import { User } from '../users/user.entity';
import { RoomPhoto } from './room-photo.entity';

export const ROOM_STATUSES = ['available', 'rented'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

@Entity()
@Index(['provinceCode', 'districtCode'])
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  ownerId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  // VND/tháng, số nguyên.
  @Index()
  @Column({ type: 'integer' })
  price: number;

  // m², số nguyên.
  @Index()
  @Column({ type: 'integer' })
  area: number;

  @Column({ type: 'varchar', length: 10 })
  provinceCode: string;

  @ManyToOne(() => Province, { nullable: false })
  @JoinColumn({ name: 'provinceCode' })
  province: Province;

  @Column({ type: 'varchar', length: 10 })
  districtCode: string;

  @ManyToOne(() => District, { nullable: false })
  @JoinColumn({ name: 'districtCode' })
  district: District;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status: RoomStatus;

  @Column({ default: false })
  hiddenByOwner: boolean;

  @Column({ default: false })
  hiddenByAdmin: boolean;

  // Xoá mềm. Cột thường (không dùng @DeleteDateColumn) để mọi truy vấn tự lọc
  // rõ ràng `deletedAt IS NULL`, và màn admin sau này vẫn đọc được phòng đã xoá.
  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RoomPhoto, (photo) => photo.room)
  photos: RoomPhoto[];
}
