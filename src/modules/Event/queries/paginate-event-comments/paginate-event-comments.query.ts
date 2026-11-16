import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateEventCommentsInput } from './paginate-event-comments.input';

export class PaginateEventCommentsQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateEventCommentsInput,
    public readonly user: TJWTPayload | null,
  ) {}
}
