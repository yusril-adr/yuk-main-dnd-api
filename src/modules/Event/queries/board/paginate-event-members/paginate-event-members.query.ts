import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateEventMembersInput } from './paginate-event-members.input';

export class PaginateEventMembersQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateEventMembersInput,
    public readonly user: TJWTPayload,
  ) {}
}
