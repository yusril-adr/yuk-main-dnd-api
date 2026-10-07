import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CreateStoryInput } from './create-story.input';

export class CreateStoryCommand {
  constructor(
    public readonly params: CreateStoryInput,
    public readonly user: TJWTPayload,
  ) {}
}
