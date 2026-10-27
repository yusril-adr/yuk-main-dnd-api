import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class RemoveStoryCommentCommand {
  constructor(
    public readonly storyId: string,
    public readonly commentId: string,
    public readonly user: TJWTPayload,
  ) {}
}
