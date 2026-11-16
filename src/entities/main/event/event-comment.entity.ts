import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { EventEntity } from './event.entity';

@Entity()
@Index(['event', 'pinnedAt', 'createdAt'])
@Index(['parent', 'createdAt'])
export class EventComment extends BaseEntity {
  @ManyToOne(() => EventEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Replies are one level deep: parent is always a top-level comment.
  @ManyToOne(() => EventComment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: EventComment | null;

  // Raw FK value, readable even when the parent is soft-deleted.
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinnedAt?: Date | null;
}

export type TEventComment = InstanceType<typeof EventComment>;
