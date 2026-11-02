import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { CreateGuestUserInput } from './create-guest-user.input';

export class CreateGuestUserCommand {
  constructor(
    public readonly params: CreateGuestUserInput,
    public readonly user: TJWTPayload,
  ) {}
}
