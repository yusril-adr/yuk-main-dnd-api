import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { StoryStatusEnum } from '@modules/Master/Story/enums/story-status.enum';
import { StoryTypeEnum } from '@modules/Master/Story/enums/story-type.enum';
import { StoryLocationTypeEnum } from '@modules/Master/Story/enums/story-location-type.enum';

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

  @Index()
  @Column({ length: 30, default: StoryTypeEnum.ONESHOT })
  type: string = StoryTypeEnum.ONESHOT;

  @Column({ length: 100, nullable: true })
  gameSystem?: string;

  @Column({ type: 'integer', nullable: true })
  maxMembers?: number;

  @Index()
  @Column({ type: 'timestamp with time zone', nullable: true })
  startAt?: Date;

  @Column({ length: 20, default: StoryLocationTypeEnum.ONLINE })
  locationType: string = StoryLocationTypeEnum.ONLINE;

  @Column({ type: 'text', nullable: true })
  locationDetail?: string;
}

export type TStory = InstanceType<typeof Story>;
