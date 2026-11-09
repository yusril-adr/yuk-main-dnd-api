import { PaginateEventsInput } from './paginate-events.input';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class PaginateEventsQuery {
  constructor(
    public readonly params: PaginateEventsInput,
    public readonly user: TJWTPayload,
  ) {}
}
