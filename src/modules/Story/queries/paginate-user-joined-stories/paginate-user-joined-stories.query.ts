import { PaginateUserJoinedStoriesInput } from './paginate-user-joined-stories.input';

export class PaginateUserJoinedStoriesQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateUserJoinedStoriesInput,
  ) {}
}
