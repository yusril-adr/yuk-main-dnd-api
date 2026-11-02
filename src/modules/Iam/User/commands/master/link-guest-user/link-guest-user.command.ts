import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { LinkGuestUserInput } from './link-guest-user.input';

export class LinkGuestUserCommand {
  constructor(
    public readonly guestId: string,
    public readonly params: LinkGuestUserInput,
    public readonly user: TJWTPayload,
  ) {}
}
