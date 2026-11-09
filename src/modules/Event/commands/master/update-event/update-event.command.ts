import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { UpdateEventInput } from './update-event.input';

export class UpdateEventCommand {
  constructor(
    public readonly id: string,
    public readonly params: UpdateEventInput,
    public readonly user: TJWTPayload,
  ) {}
}
