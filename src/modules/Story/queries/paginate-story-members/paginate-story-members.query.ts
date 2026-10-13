import { PaginateStoryMembersInput } from './paginate-story-members.input';

export class PaginateStoryMembersQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateStoryMembersInput,
  ) {}
}
