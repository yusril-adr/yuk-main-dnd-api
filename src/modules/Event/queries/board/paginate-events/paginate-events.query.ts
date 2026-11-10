import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateEventsInput } from './paginate-events.input';

export class PaginateEventsQuery {
  constructor(
    public readonly params: PaginateEventsInput,
    public readonly user: TJWTPayload,
  ) {}
}
