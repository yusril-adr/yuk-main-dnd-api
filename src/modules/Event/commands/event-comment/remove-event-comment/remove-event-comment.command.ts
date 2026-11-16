import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class RemoveEventCommentCommand {
  constructor(
    public readonly eventId: string,
    public readonly commentId: string,
    public readonly user: TJWTPayload,
  ) {}
}
