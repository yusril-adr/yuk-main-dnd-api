import { PaginateUserStoriesInput } from './paginate-user-stories.input';

export class PaginateUserStoriesQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateUserStoriesInput,
  ) {}
}
