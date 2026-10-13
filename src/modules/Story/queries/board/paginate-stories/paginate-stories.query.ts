import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateStoriesInput } from './paginate-stories.input';

export class PaginateStoriesQuery {
  constructor(
    public readonly params: PaginateStoriesInput,
    public readonly user: TJWTPayload,
  ) {}
}
