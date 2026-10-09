import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { AddStoryMembersInput } from './add-story-members.input';

export class AddStoryMembersCommand {
  constructor(
    public readonly id: string,
    public readonly params: AddStoryMembersInput,
    public readonly user: TJWTPayload,
  ) {}
}
