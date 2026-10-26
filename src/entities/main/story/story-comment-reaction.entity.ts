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
import { StoryCommentReactionTypeEnum } from '@modules/Story/enums/story-comment-reaction-type.enum';
import { User } from '../iam/user.entity';
import { StoryComment } from './story-comment.entity';

// Hard-deleted, so no deleted_at. The unique (comment_id, user_id) index
// also serves lookups by comment_id.
@Entity()
@Unique(['comment', 'user'])
export class StoryCommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StoryComment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: StoryComment;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer' })
  type: StoryCommentReactionTypeEnum;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

export type TStoryCommentReaction = InstanceType<typeof StoryCommentReaction>;
