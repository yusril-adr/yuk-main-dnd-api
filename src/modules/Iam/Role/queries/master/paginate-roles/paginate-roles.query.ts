import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PaginateRolesInput } from './paginate-roles.input';

export class PaginateRolesQuery {
  constructor(
    public readonly params: PaginateRolesInput,
    public readonly user: TJWTPayload,
  ) {}
}
