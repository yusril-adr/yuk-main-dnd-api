import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { AddEventMembersInput } from './add-event-members.input';

export class AddEventMembersCommand {
  constructor(
    public readonly id: string,
    public readonly params: AddEventMembersInput,
    public readonly user: TJWTPayload,
  ) {}
}
