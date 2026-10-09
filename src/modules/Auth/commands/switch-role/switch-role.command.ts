import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class SwitchRoleCommand {
  constructor(
    public readonly roleKey: string,
    public readonly currentUser: TJWTPayload,
  ) {}
}
