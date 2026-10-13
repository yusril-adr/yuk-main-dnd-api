import {
  And,
  Equal,
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  FindOptionsWhere,
  ILike,
  In,
  Raw,
} from 'typeorm';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { User, type TUser } from '@entities/main/iam/user.entity';

export const PUBLIC_USER_LEADERBOARD_ORDER = {
  dmExp: OrderKeyEnum.DESC,
  playerExp: OrderKeyEnum.DESC,
  id: OrderKeyEnum.ASC,
} as const;

export const PUBLIC_USER_RELATIONS = {
  avatarFile: true,
  userRoles: { role: true },
} as const;

export type PublicUserRole = {
  id: string;
  key: string;
  name: string;
};

export type PublicUserCard = {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  dmExp: number;
  dmLevel: number;
  playerExp: number;
  playerLevel: number;
  roles: PublicUserRole[];
};

export type PublicUserProfile = PublicUserCard & {
  bio: string | null;
  createdAt: string;
};

export type PublicUserListParams = {
  search?: string;
  page: number;
  perPage: number;
};

// A userRoles where joins roles into the page query. take, skip, and count
// then count join rows, so two public roles become two slots.
export function publicUserExistsSql(alias: string): string {
  return `EXISTS (SELECT 1 FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${alias} AND r.is_show_in_public = true AND ur.deleted_at IS NULL AND r.deleted_at IS NULL)`;
}

export function publicUserVisible(): FindOperator<string> {
  return Raw((alias) => publicUserExistsSql(alias));
}

export function publicUserWhere(
  search?: string,
): FindOptionsWhere<User> | FindOptionsWhere<User>[] {
  const visible = { id: publicUserVisible() };
  const term = search?.trim();
  if (!term) {
    return visible;
  }
  return [
    { ...visible, username: ILike(`%${term}%`) },
    { ...visible, displayName: ILike(`%${term}%`) },
  ];
}

export type PublicUserListQueries = {
  page: Pick<
    FindManyOptions<User>,
    'select' | 'where' | 'order' | 'take' | 'skip'
  >;
  count: Pick<FindManyOptions<User>, 'where'>;
  hydrate: (
    ids: readonly string[],
  ) => Pick<FindManyOptions<User>, 'where' | 'relations'>;
};

export function publicUserListOptions(
  params: PublicUserListParams,
): PublicUserListQueries {
  const where = publicUserWhere(params.search);
  return {
    page: {
      select: { id: true, dmExp: true, playerExp: true },
      where,
      order: PUBLIC_USER_LEADERBOARD_ORDER,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    },
    count: { where },
    hydrate: (ids) => ({
      where: { id: In([...ids]) },
      relations: PUBLIC_USER_RELATIONS,
    }),
  };
}

export function publicUserDetailOptions(id: string): FindOneOptions<User> {
  return {
    where: { id: And(Equal(id), publicUserVisible()) },
    relations: PUBLIC_USER_RELATIONS,
  };
}

export function toPublicRoles(user: TUser): PublicUserRole[] {
  const roles: PublicUserRole[] = [];
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

export function toPublicUserCard(
  user: TUser,
  avatarUrl: string | null,
): PublicUserCard {
  return {
    id: user.id,
    username: user.username ?? null,
    displayName: user.displayName,
    avatarUrl,
    dmExp: user.dmExp,
    dmLevel: user.dmLevel,
    playerExp: user.playerExp,
    playerLevel: user.playerLevel,
    roles: toPublicRoles(user),
  };
}

export function toPublicUserProfile(
  user: TUser,
  avatarUrl: string | null,
): PublicUserProfile {
  return {
    ...toPublicUserCard(user, avatarUrl),
    bio: user.bio ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
