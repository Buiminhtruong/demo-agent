import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Luôn lưu chữ thường, đã bỏ khoảng trắng hai đầu.
  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column()
  phone: string;

  @Column({ type: 'varchar', length: 20 })
  role: Role;

  @Column({ default: false })
  isLocked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
