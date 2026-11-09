import { PaginateEventMembersInput } from './paginate-event-members.input';

export class PaginateEventMembersQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateEventMembersInput,
  ) {}
}
