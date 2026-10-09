import { GetStoryMembersInput } from './get-story-members.input';

export class GetStoryMembersQuery {
  constructor(
    public readonly id: string,
    public readonly params: GetStoryMembersInput,
  ) {}
}
