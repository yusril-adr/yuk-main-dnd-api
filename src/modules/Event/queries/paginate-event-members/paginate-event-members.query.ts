import { PaginateEventMembersInput } from './paginate-event-members.input';

export class PaginateEventMembersQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateEventMembersInput,
  ) {}
}
