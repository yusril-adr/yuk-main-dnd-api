import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { File } from '../file.entity';
import { StoryStatusEnum } from '@modules/Master/Story/enums/story-status.enum';

@Entity()
export class Story extends BaseEntity {
  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 180, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @Column({ length: 30, default: StoryStatusEnum.DRAFT })
  status: string = StoryStatusEnum.DRAFT;

  @Column({ type: 'varchar', length: 30, nullable: true })
  statusBefore?: string | null;

  @Index()
  @Column({ length: 30 })
  type: string;

  @Column({ length: 100, nullable: true })
  gameSystem?: string;

  @Column({ type: 'integer', default: 0 })
  expAwarded: number = 0;

  @Column({ type: 'integer', default: 0 })
  pointAwarded: number = 0;

  @Column({ type: 'integer', nullable: true })
  maxMembers?: number;

  @Index()
  @Column({ type: 'timestamp with time zone', nullable: true })
  startAt?: Date | null;

  @Column({ length: 20 })
  locationType: string;

  @Column({ type: 'text' })
  locationDetail: string;

  @OneToOne(() => File, (file) => file.id, { cascade: true })
  @JoinColumn()
  bannerFile?: File | null;
}

export type TStory = InstanceType<typeof Story>;
