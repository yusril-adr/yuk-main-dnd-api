import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from '../iam/user.entity';
import { EventEntity } from './event.entity';
import { EventMemberStatusEnum } from '@modules/Event/enums/event-member-status.enum';

@Index('UQ_event_members_event_user_active', ['event', 'user'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity()
export class EventMember extends BaseEntity {
  @Index()
  @ManyToOne(() => EventEntity, (event) => event.eventMembers, {
    nullable: false,
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Index()
  @ManyToOne(() => User, (user) => user.eventMembers, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer', default: EventMemberStatusEnum.REGISTERED })
  status: number = EventMemberStatusEnum.REGISTERED;
}

export type TEventMember = InstanceType<typeof EventMember>;
