import type { TUser } from '@entities/main/user.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { UserStatusEnum } from '@shared/enums/user.enum';
import dayjs from '@shared/utils/dayjs';

export type TUserEntityDto = Omit<
  TUser,
  'password' | 'createdAt' | 'updatedAt'
> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

export class UserEntityDto implements TUserEntityDto {
  id: string;
  name: string;
  email: string;
  role: PermissionEnum;
  status: UserStatusEnum;
  createdAt: string;
  updatedAt: string;

  parseEntity({
    id,
    name,
    email,
    role,
    status,
    createdAt,
    updatedAt,
  }: TUserEntityDto): UserEntityDto {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.status = status;
    this.createdAt = dayjs(createdAt).toISOString();
    this.updatedAt = dayjs(updatedAt).toISOString();

    return this;
  }
}
