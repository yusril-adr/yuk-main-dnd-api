import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class PinEventCommentCommand {
  constructor(
    public readonly eventId: string,
    public readonly commentId: string,
    public readonly user: TJWTPayload,
  ) {}
}
