import { GetAvailableStoryUsersInput } from './get-available-story-users.input';

export class GetAvailableStoryUsersQuery {
  constructor(
    public readonly id: string,
    public readonly params: GetAvailableStoryUsersInput,
  ) {}
}
