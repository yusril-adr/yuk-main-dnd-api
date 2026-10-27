import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { UpdateStoryCommentInput } from './update-story-comment.input';

export class UpdateStoryCommentCommand {
  constructor(
    public readonly storyId: string,
    public readonly commentId: string,
    public readonly payload: UpdateStoryCommentInput,
    public readonly user: TJWTPayload,
  ) {}
}
