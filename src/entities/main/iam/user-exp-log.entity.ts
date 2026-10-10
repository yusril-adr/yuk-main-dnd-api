import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from './user.entity';

@Entity()
@Index(['user', 'createdAt'])
export class UserExpLog extends BaseEntity {
  @ManyToOne(() => User, (user) => user.userExpLogs, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
}

export type TUserExpLog = InstanceType<typeof UserExpLog>;
