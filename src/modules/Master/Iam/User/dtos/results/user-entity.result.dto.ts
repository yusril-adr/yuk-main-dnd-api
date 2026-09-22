import type { TUser } from '@entities/main/user.entity';
import dayjs from '@shared/utils/dayjs';

export type TUserEntityDto = Omit<
  TUser,
  'password' | 'userRoles' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export class UserEntityDto implements TUserEntityDto {
  id: string;
  username?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  exp: number;
  level: number;
  roles: string[];
  createdAt: string;
  updatedAt: string;

  parseEntity(user: TUser): UserEntityDto {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.displayName = user.displayName;
    this.avatarUrl = user.avatarUrl;
    this.bio = user.bio;
    this.exp = user.exp;
    this.level = user.level;
    this.roles = (user.userRoles ?? [])
      .map((userRole) => userRole.role?.key)
      .filter((key): key is string => Boolean(key));
    this.createdAt = dayjs(user.createdAt).toISOString();
    this.updatedAt = dayjs(user.updatedAt).toISOString();

    return this;
  }
}
