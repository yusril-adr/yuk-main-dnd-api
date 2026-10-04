import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';

@Entity()
export class File extends BaseEntity {
  @Column()
  name: string;

  @Column()
  bucket: string;

  @Column()
  path: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @Column({ length: 50 })
  driver: string;

  @Column({ length: 50, default: FileStatusEnum.ACTIVE })
  status: string = FileStatusEnum.ACTIVE;
}

export type TFile = InstanceType<typeof File>;
