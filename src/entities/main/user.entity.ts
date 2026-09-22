import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from './user-role.entity';

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
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'integer', default: 0 })
  exp: number = 0;

  @Column({ type: 'integer', default: 1 })
  level: number = 1;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
}

export type TUser = InstanceType<typeof User>;
