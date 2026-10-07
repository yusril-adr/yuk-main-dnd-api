import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { UpdatePasswordInput } from './update-password.input';

export class UpdatePasswordCommand {
  constructor(
    public readonly payload: UpdatePasswordInput,
    public readonly currentUser: TJWTPayload,
  ) {}
}