import { PaginateAvailableEventUsersInput } from './paginate-available-event-users.input';

export class PaginateAvailableEventUsersQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateAvailableEventUsersInput,
  ) {}
}
