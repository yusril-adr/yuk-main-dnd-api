import type { TRole } from '@entities/main/iam/role.entity';
import dayjs from '@shared/utils/dayjs';
import { PermissionEntityDto } from '@modules/Master/Iam/Permission/dtos/results/permission-entity.result.dto';

export type TRoleEntityDto = Omit<
  TRole,
  'userRoles' | 'rolePermissions' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  permissions?: PermissionEntityDto[];
  createdAt: string;
  updatedAt: string;
};

export class RoleEntityDto implements TRoleEntityDto {
  id: string;
  key: string;
  name: string;
  description?: string;
  permissions?: PermissionEntityDto[];
  createdAt: string;
  updatedAt: string;

  parseEntity(role: TRole): RoleEntityDto {
    this.id = role.id;
    this.key = role.key;
    this.name = role.name;
    this.description = role.description;
    if (role.rolePermissions) {
      this.permissions = role.rolePermissions
        .map((rolePermission) => rolePermission.permission)
        .filter((permission): permission is NonNullable<typeof permission> =>
          Boolean(permission),
        )
        .map((permission) => new PermissionEntityDto().parseEntity(permission));
    }
    this.createdAt = dayjs(role.createdAt).toISOString();
    this.updatedAt = dayjs(role.updatedAt).toISOString();

    return this;
  }
}
