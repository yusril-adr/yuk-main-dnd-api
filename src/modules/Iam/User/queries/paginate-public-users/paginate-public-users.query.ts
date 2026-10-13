import type { PublicUserListParams } from '../public-user-directory';
import { PaginatePublicUsersInput } from './paginate-public-users.input';

export type NoClientSort<T> = 'sortBy' extends keyof T
  ? never
  : 'order' extends keyof T
    ? never
    : T;

export class PaginatePublicUsersQuery {
  readonly params: PublicUserListParams;

  constructor(input: NoClientSort<PaginatePublicUsersInput>) {
    const search = input.search?.trim();
    this.params = {
      search: search ? search : undefined,
      page: input.page,
      perPage: input.perPage,
    };
  }
}
