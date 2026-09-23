import type { TPermission } from '@entities/main/permission.entity';
import dayjs from '@shared/utils/dayjs';

export type TPermissionEntityDto = Omit<
  TPermission,
  'createdAt' | 'updatedAt' | 'deletedAt' | 'rolePermissions'
> & {
  createdAt: string;
  updatedAt: string;
};

export class PermissionEntityDto implements TPermissionEntityDto {
  id: string;
  module: string;
  action: string;
  key: string;
  createdAt: string;
  updatedAt: string;

  parseEntity(permission: TPermission): PermissionEntityDto {
    this.id = permission.id;
    this.module = permission.module;
    this.action = permission.action;
    this.key = permission.key;
    this.createdAt = dayjs(permission.createdAt).toISOString();
    this.updatedAt = dayjs(permission.updatedAt).toISOString();

    return this;
  }
}
