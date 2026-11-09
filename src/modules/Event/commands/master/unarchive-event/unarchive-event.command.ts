import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class UnarchiveEventCommand {
  constructor(
    public readonly id: string,
    public readonly user: TJWTPayload,
  ) {}
}
