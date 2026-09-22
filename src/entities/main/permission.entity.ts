import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RolePermission } from './role-permission.entity';

@Entity()
@Unique(['module', 'action'])
export class Permission extends BaseEntity {
  @Column({ length: 50 })
  module: string;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 150 })
  key: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];
}

export type TPermission = InstanceType<typeof Permission>;
