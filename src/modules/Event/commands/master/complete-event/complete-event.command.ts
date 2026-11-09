import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CompleteEventInput } from './complete-event.input';

export class CompleteEventCommand {
  constructor(
    public readonly id: string,
    public readonly params: CompleteEventInput,
    public readonly user: TJWTPayload,
  ) {}
}
