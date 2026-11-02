import type { TUser } from '@entities/main/iam/user.entity';

export class PaginateUserOptionsItemOutput {
  id: string;
  displayName: string;
  username: string | null;
  isGuest: boolean;

  constructor(
    user: Pick<TUser, 'id' | 'displayName' | 'username' | 'isGuest'>,
  ) {
    this.id = user.id;
    this.displayName = user.displayName;
    this.username = user.username ?? null;
    this.isGuest = user.isGuest === true;
  }
}

export class PaginateUserOptionsOutput {
  public readonly data: PaginateUserOptionsItemOutput[];
  public readonly count: number;

  constructor(
    users: Pick<TUser, 'id' | 'displayName' | 'username' | 'isGuest'>[],
    count: number,
  ) {
    this.data = users.map((user) => new PaginateUserOptionsItemOutput(user));
    this.count = count;
  }
}
