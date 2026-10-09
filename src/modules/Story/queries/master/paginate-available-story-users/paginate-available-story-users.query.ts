import { PaginateAvailableStoryUsersInput } from './paginate-available-story-users.input';

export class PaginateAvailableStoryUsersQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateAvailableStoryUsersInput,
  ) {}
}
