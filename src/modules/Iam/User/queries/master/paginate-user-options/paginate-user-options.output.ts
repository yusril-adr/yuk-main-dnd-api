import type { TUser } from '@entities/main/iam/user.entity';

export class PaginateUserOptionsItemOutput {
  id: string;
  displayName: string;
  username: string | null;

  constructor(user: Pick<TUser, 'id' | 'displayName' | 'username'>) {
    this.id = user.id;
    this.displayName = user.displayName;
    this.username = user.username ?? null;
  }
}

export class PaginateUserOptionsOutput {
  public readonly data: PaginateUserOptionsItemOutput[];
  public readonly count: number;

  constructor(
    users: Pick<TUser, 'id' | 'displayName' | 'username'>[],
    count: number,
  ) {
    this.data = users.map((user) => new PaginateUserOptionsItemOutput(user));
    this.count = count;
  }
}
