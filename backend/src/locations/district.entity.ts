import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class District {
  // Mã hành chính (GSO), vd "765".
  @PrimaryColumn({ type: 'varchar', length: 10 })
  code: string;

  @Column()
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 10 })
  provinceCode: string;
}
