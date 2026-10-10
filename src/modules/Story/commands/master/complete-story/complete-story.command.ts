import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CompleteStoryInput } from './complete-story.input';

export class CompleteStoryCommand {
  constructor(
    public readonly id: string,
    public readonly params: CompleteStoryInput,
    public readonly user: TJWTPayload,
  ) {}
}
