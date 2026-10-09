import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { UpdateProfileInput } from './update-profile.input';

export class UpdateProfileCommand {
  constructor(
    public readonly payload: UpdateProfileInput,
    public readonly currentUser: TJWTPayload,
  ) {}
}
