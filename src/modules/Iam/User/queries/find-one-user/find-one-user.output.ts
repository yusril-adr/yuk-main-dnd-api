import type { TUser } from '@entities/main/iam/user.entity';
import {
  publicRoles,
  type TPublicUserRole,
} from '../paginate-users/paginate-users.output';

export class FindOneUserOutput {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  dmExp: number;
  dmLevel: number;
  playerExp: number;
  playerLevel: number;
  roles: TPublicUserRole[];
  createdAt: string;

  constructor(
    payload: Pick<
      TUser,
      | 'id'
      | 'username'
      | 'displayName'
      | 'bio'
      | 'dmExp'
      | 'dmLevel'
      | 'playerExp'
      | 'playerLevel'
      | 'userRoles'
      | 'createdAt'
    >,
    avatarUrl: string | null,
  ) {
    this.id = payload.id;
    this.username = payload.username ?? null;
    this.displayName = payload.displayName;
    this.avatarUrl = avatarUrl;
    this.bio = payload.bio ?? null;
    this.dmExp = payload.dmExp;
    this.dmLevel = payload.dmLevel;
    this.playerExp = payload.playerExp;
    this.playerLevel = payload.playerLevel;
    this.roles = publicRoles(payload);
    this.createdAt = payload.createdAt.toISOString();
  }
}
