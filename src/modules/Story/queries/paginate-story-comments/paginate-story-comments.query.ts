import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateStoryCommentsInput } from './paginate-story-comments.input';

export class PaginateStoryCommentsQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateStoryCommentsInput,
    public readonly user: TJWTPayload | null,
  ) {}
}
