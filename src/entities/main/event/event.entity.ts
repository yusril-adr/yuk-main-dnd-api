import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { File } from '../file.entity';
import { EventStatusEnum } from '@modules/Event/enums/event-status.enum';
import { EventMember } from './event-member.entity';

@Entity('events')
export class EventEntity extends BaseEntity {
  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 180, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Index()
  @Column({ type: 'integer', default: EventStatusEnum.DRAFT })
  status: number = EventStatusEnum.DRAFT;

  @Column({ type: 'integer', nullable: true })
  statusBefore?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationLink?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  feedbackFormLink?: string | null;

  @Column({ type: 'integer', default: 0 })
  expAwarded: number = 0;

  @Column({ type: 'integer', default: 0 })
  pointAwarded: number = 0;

  @Column({ type: 'integer', nullable: true })
  maxMembers?: number | null;

  @Index()
  @Column({ type: 'timestamp with time zone', nullable: true })
  startAt?: Date | null;

  @Column({ type: 'integer' })
  locationType: number;

  @Column({ type: 'text' })
  locationDetail: string;

  @OneToOne(() => File, (file) => file.id, { cascade: true })
  @JoinColumn()
  bannerFile?: File | null;

  @OneToMany(() => EventMember, (eventMember) => eventMember.event)
  eventMembers: EventMember[];
}

export type TEvent = InstanceType<typeof EventEntity>;
