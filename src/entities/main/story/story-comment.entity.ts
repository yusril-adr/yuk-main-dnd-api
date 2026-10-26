import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { Story } from './story.entity';

@Entity()
@Index(['story', 'pinnedAt', 'createdAt'])
@Index(['parent', 'createdAt'])
export class StoryComment extends BaseEntity {
  @ManyToOne(() => Story, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Replies are one level deep: parent is always a top-level comment.
  @ManyToOne(() => StoryComment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: StoryComment | null;

  // Raw FK value, readable even when the parent is soft-deleted.
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinnedAt?: Date | null;
}

export type TStoryComment = InstanceType<typeof StoryComment>;
