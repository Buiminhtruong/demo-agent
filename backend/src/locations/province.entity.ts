import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Province {
  // Mã hành chính (GSO), vd "79".
  @PrimaryColumn({ type: 'varchar', length: 10 })
  code: string;

  @Column()
  name: string;
}
