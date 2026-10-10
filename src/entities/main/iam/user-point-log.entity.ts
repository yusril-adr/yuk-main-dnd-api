import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';
import { BaseEntity } from '../base.entity';
import { User } from './user.entity';

@Entity()
@Index(['user', 'createdAt'])
export class UserPointLog extends BaseEntity {
  @ManyToOne(() => User, (user) => user.userPointLogs, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer' })
  type: UserPointLogTypeEnum;

  @Column({ type: 'text', nullable: true })
  description?: string;
}

export type TUserPointLog = InstanceType<typeof UserPointLog>;
