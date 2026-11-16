import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { UpdateEventCommentInput } from './update-event-comment.input';

export class UpdateEventCommentCommand {
  constructor(
    public readonly eventId: string,
    public readonly commentId: string,
    public readonly payload: UpdateEventCommentInput,
    public readonly user: TJWTPayload,
  ) {}
}
