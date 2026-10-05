import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

@Entity()
export class Role extends BaseEntity {
  @Column({ length: 50, unique: true })
  key: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isShowInPublic: boolean = true;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}

export type TRole = InstanceType<typeof Role>;
