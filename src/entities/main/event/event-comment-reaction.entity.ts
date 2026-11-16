import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EventCommentReactionTypeEnum } from '@modules/Event/enums/event-comment-reaction-type.enum';
import { User } from '../iam/user.entity';
import { EventComment } from './event-comment.entity';

// Hard-deleted, so no deleted_at. The unique (comment_id, user_id) index
// also serves lookups by comment_id.
@Entity()
@Unique(['comment', 'user'])
export class EventCommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EventComment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: EventComment;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer' })
  type: EventCommentReactionTypeEnum;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

export type TEventCommentReaction = InstanceType<typeof EventCommentReaction>;
