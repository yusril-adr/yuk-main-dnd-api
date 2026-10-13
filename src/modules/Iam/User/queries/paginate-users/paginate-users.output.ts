import type { TUser } from '@entities/main/iam/user.entity';

export type TPublicUserRole = {
  id: string;
  key: string;
  name: string;
};

export type TPaginateUsersItemOutput = Pick<
  TUser,
  'id' | 'displayName' | 'dmExp' | 'dmLevel' | 'playerExp' | 'playerLevel'
> & {
  username: string | null;
  avatarUrl: string | null;
  roles: TPublicUserRole[];
};

export class PaginateUsersItemOutput implements TPaginateUsersItemOutput {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  dmExp: number;
  dmLevel: number;
  playerExp: number;
  playerLevel: number;
  roles: TPublicUserRole[];

  constructor(payload: TUser, avatarUrl: string | null) {
    this.id = payload.id;
    this.username = payload.username ?? null;
    this.displayName = payload.displayName;
    this.avatarUrl = avatarUrl;
    this.dmExp = payload.dmExp;
    this.dmLevel = payload.dmLevel;
    this.playerExp = payload.playerExp;
    this.playerLevel = payload.playerLevel;
    this.roles = publicRoles(payload);
  }
}

export class PaginateUsersOutput {
  public readonly data: PaginateUsersItemOutput[];
  public readonly count: number;

  constructor(users: TUser[], avatarUrls: (string | null)[], count: number) {
    this.data = users.map(
      (user, i) => new PaginateUsersItemOutput(user, avatarUrls[i]),
    );
    this.count = count;
  }
}

export function publicRoles(user: TUser): TPublicUserRole[] {
  const roles: TPublicUserRole[] = [];
  for (const userRole of user.userRoles ?? []) {
    const role = userRole.role;
    if (!role || role.isShowInPublic !== true) {
      continue;
    }
    roles.push({ id: role.id, key: role.key, name: role.name });
  }
  roles.sort((left, right) => {
    if (left.name < right.name) return -1;
    if (left.name > right.name) return 1;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  });
  return roles;
}
