import { PaginateStoriesInput } from './paginate-stories.input';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class PaginateStoriesQuery {
  constructor(
    public readonly params: PaginateStoriesInput,
    public readonly user: TJWTPayload,
  ) {}
}
