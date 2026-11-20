import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class RoomPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  roomId: number;

  @ManyToOne(() => Room, (room) => room.photos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  // Tên file trong thư mục uploads (url = /uploads/<filename>).
  @Column({ type: 'varchar', length: 255 })
  filename: string;

  // Thứ tự hiển thị, nhỏ nhất là ảnh đại diện.
  @Column({ type: 'integer' })
  position: number;
}
