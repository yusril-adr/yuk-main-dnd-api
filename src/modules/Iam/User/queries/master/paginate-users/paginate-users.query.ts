import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateUsersInput } from './paginate-users.input';

export class PaginateUsersQuery {
  constructor(
    public readonly params: PaginateUsersInput,
    public readonly user: TJWTPayload,
  ) {}
}
