import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { UpdateUserInput } from './update-user.input';

export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly params: UpdateUserInput,
    public readonly user: TJWTPayload,
  ) {}
}