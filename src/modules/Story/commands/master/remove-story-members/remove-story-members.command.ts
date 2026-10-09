import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { RemoveStoryMembersInput } from './remove-story-members.input';

export class RemoveStoryMembersCommand {
  constructor(
    public readonly id: string,
    public readonly params: RemoveStoryMembersInput,
    public readonly user: TJWTPayload,
  ) {}
}
