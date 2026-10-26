import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CreateStoryCommentInput } from './create-story-comment.input';

export class CreateStoryCommentCommand {
  constructor(
    public readonly storyId: string,
    public readonly payload: CreateStoryCommentInput,
    public readonly user: TJWTPayload,
  ) {}
}
