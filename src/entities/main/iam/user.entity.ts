import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { UserRole } from './user-role.entity';
import { File } from '../file.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ length: 50, nullable: true })
  username?: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 100 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

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

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
}

export type TUser = InstanceType<typeof User>;
