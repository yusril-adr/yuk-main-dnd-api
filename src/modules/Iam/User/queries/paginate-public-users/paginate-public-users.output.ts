import type { PublicUserCard } from '../public-user-directory';

export class PaginatePublicUsersOutput {
  public readonly data: PublicUserCard[];
  public readonly count: number;

  constructor(data: PublicUserCard[], count: number) {
    this.data = data;
    this.count = count;
  }
}
