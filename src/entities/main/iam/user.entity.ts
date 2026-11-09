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
import { UserRole } from './user-role.entity';
import { File } from '../file.entity';
import { UserExpLog } from './user-exp-log.entity';
import { UserPointLog } from './user-point-log.entity';
import { StoryMember } from '../story/story-member.entity';
import { EventMember } from '../event/event-member.entity';

@Index('UQ_users_email_active', ['email'], {
  unique: true,
  where: '"email" IS NOT NULL AND "deleted_at" IS NULL',
})
// Expression index LOWER(username); owned by migration (TypeORM cannot express it).
@Index('UQ_users_username_active', { synchronize: false })
@Entity()
export class User extends BaseEntity {
  @Column({ length: 50, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'boolean', default: false })
  isGuest: boolean = false;

  @Column({ type: 'integer', default: 0 })
  playerExp: number = 0;

  @Column({ type: 'integer', default: 1 })
  playerLevel: number = 1;

  @Column({ type: 'integer', default: 0 })
  dmExp: number = 0;

  @Column({ type: 'integer', default: 1 })
  dmLevel: number = 1;

  @Column({ type: 'integer', default: 0 })
  points: number = 0;

  @OneToOne(() => File, (file) => file.id, { cascade: true })
  @JoinColumn()
  avatarFile?: File | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'merged_into_user_id' })
  mergedIntoUser?: User | null;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => StoryMember, (storyMember) => storyMember.user)
  storyMembers: StoryMember[];

  @OneToMany(() => EventMember, (eventMember) => eventMember.user)
  eventMembers: EventMember[];

  @OneToMany(() => UserExpLog, (userExpLog) => userExpLog.user)
  userExpLogs: UserExpLog[];

  @OneToMany(() => UserPointLog, (userPointLog) => userPointLog.user)
  userPointLogs: UserPointLog[];
}

export type TUser = InstanceType<typeof User>;
