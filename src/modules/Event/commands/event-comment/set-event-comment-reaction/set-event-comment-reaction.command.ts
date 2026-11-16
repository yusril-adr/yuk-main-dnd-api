import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { SetEventCommentReactionInput } from './set-event-comment-reaction.input';

export class SetEventCommentReactionCommand {
  constructor(
    public readonly eventId: string,
    public readonly commentId: string,
    public readonly payload: SetEventCommentReactionInput,
    public readonly user: TJWTPayload,
  ) {}
}
