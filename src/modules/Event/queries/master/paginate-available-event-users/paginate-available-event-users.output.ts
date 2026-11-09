import type { TUser } from '@entities/main/iam/user.entity';

export class PaginateAvailableEventUsersItemOutput {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  username?: string | null;
  isGuest: boolean;

  constructor(user: TUser, avatarUrl?: string | null) {
    this.id = user.id;
    this.displayName = user.displayName;
    this.avatarUrl = avatarUrl ?? null;
    this.username = user.username;
    this.isGuest = user.isGuest === true;
  }
}

export class PaginateAvailableEventUsersOutput {
  public readonly data: PaginateAvailableEventUsersItemOutput[];
  public readonly count: number;

  constructor(
    users: TUser[],
    avatarUrls: (string | undefined)[],
    count: number,
  ) {
    this.data = users.map(
      (user, i) =>
        new PaginateAvailableEventUsersItemOutput(user, avatarUrls[i]),
    );
    this.count = count;
  }
}
