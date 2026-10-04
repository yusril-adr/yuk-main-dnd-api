import type { TUser } from '@entities/main/iam/user.entity';
import dayjs from '@shared/utils/dayjs';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export type TUserEntityDto = Omit<
  TUser,
  'password' | 'userRoles' | 'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  roles?: RoleEntityDto[];
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
  playerExp: number;
  playerLevel: number;
  dmExp: number;
  dmLevel: number;
  points: number;
  roles?: RoleEntityDto[];
  createdAt: string;
  updatedAt: string;

  parseEntity(user: TUser, avatarUrl?: string): UserEntityDto {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.displayName = user.displayName;
    if (avatarUrl) {
      this.avatarUrl = avatarUrl;
    }
    this.bio = user.bio;
    this.playerExp = user.playerExp;
    this.playerLevel = user.playerLevel;
    this.dmExp = user.dmExp;
    this.dmLevel = user.dmLevel;
    this.points = user.points;

    if (user.userRoles) {
      this.roles = user.userRoles
        .map((userRole) => userRole.role)
        .filter((role): role is NonNullable<typeof role> => Boolean(role))
        .map((role) => new RoleEntityDto().parseEntity(role));
    }
    this.createdAt = dayjs(user.createdAt).toISOString();
    this.updatedAt = dayjs(user.updatedAt).toISOString();

    return this;
  }
}
