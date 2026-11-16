import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateEventCommentRepliesInput } from './paginate-event-comment-replies.input';

export class PaginateEventCommentRepliesQuery {
  constructor(
    public readonly identifier: string,
    public readonly commentId: string,
    public readonly params: PaginateEventCommentRepliesInput,
    public readonly user: TJWTPayload | null,
  ) {}
}
