import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class RequestDmCommand {
  constructor(
    public readonly currentUser: TJWTPayload,
    public readonly token: string,
  ) {}
}
