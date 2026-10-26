import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { Story } from './story.entity';

@Entity()
@Index(['story', 'pinnedAt', 'createdAt'])
export class StoryComment extends BaseEntity {
  @ManyToOne(() => Story, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pinnedAt?: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'pinned_by' })
  pinnedBy?: User | null;
}

export type TStoryComment = InstanceType<typeof StoryComment>;
