import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateStoryCommentRepliesInput } from './paginate-story-comment-replies.input';

export class PaginateStoryCommentRepliesQuery {
  constructor(
    public readonly identifier: string,
    public readonly commentId: string,
    public readonly params: PaginateStoryCommentRepliesInput,
    public readonly user: TJWTPayload | null,
  ) {}
}
