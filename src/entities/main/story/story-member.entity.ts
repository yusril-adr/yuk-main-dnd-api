import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { Story } from './story.entity';

@Entity()
export class StoryMember extends BaseEntity {
  @Index()
  @ManyToOne(() => Story, (story) => story.storyMembers, { nullable: false })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  @Index()
  @ManyToOne(() => User, (user) => user.storyMembers, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer' })
  status: number;
}

export type TStoryMember = InstanceType<typeof StoryMember>;
