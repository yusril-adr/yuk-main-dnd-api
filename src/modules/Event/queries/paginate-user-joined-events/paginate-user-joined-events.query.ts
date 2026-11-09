import { PaginateUserJoinedEventsInput } from './paginate-user-joined-events.input';

export class PaginateUserJoinedEventsQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateUserJoinedEventsInput,
  ) {}
}
