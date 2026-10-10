import type { TUser } from '@entities/main/iam/user.entity';

export class PaginateAvailableStoryUsersItemOutput {
  id: string;
  displayName: string;
  avatarUrl: string | null;

  constructor(user: TUser, avatarUrl?: string | null) {
    this.id = user.id;
    this.displayName = user.displayName;
    this.avatarUrl = avatarUrl ?? null;
  }
}

export class PaginateAvailableStoryUsersOutput {
  public readonly data: PaginateAvailableStoryUsersItemOutput[];
  public readonly count: number;

  constructor(
    users: TUser[],
    avatarUrls: (string | undefined)[],
    count: number,
  ) {
    this.data = users.map(
      (user, i) =>
        new PaginateAvailableStoryUsersItemOutput(user, avatarUrls[i]),
    );
    this.count = count;
  }
}
