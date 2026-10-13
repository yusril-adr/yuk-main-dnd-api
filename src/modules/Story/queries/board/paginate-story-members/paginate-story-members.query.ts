import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateStoryMembersInput } from './paginate-story-members.input';

export class PaginateStoryMembersQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateStoryMembersInput,
    public readonly user: TJWTPayload,
  ) {}
}
