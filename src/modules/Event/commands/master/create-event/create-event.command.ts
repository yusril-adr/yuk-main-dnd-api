import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CreateEventInput } from './create-event.input';

export class CreateEventCommand {
  constructor(
    public readonly params: CreateEventInput,
    public readonly user: TJWTPayload,
  ) {}
}
