import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { RemoveEventMembersInput } from './remove-event-members.input';

export class RemoveEventMembersCommand {
  constructor(
    public readonly id: string,
    public readonly params: RemoveEventMembersInput,
    public readonly user: TJWTPayload,
  ) {}
}
