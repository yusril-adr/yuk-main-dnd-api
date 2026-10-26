import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { SetStoryCommentReactionInput } from './set-story-comment-reaction.input';

export class SetStoryCommentReactionCommand {
  constructor(
    public readonly storyId: string,
    public readonly commentId: string,
    public readonly payload: SetStoryCommentReactionInput,
    public readonly user: TJWTPayload,
  ) {}
}
