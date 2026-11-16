import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CreateEventCommentInput } from './create-event-comment.input';

export class CreateEventCommentCommand {
  constructor(
    public readonly eventId: string,
    public readonly payload: CreateEventCommentInput,
    public readonly user: TJWTPayload,
  ) {}
}
