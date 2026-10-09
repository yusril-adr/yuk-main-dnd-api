import type { TRole } from '@entities/main/iam/role.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export class PaginateRolesOutput {
  constructor(
    public readonly data: RoleEntityDto[],
    public readonly count: number,
  ) {}

  static from(data: TRole[], count: number): PaginateRolesOutput {
    return new PaginateRolesOutput(
      data.map((r) => new RoleEntityDto().parseEntity(r)),
      count,
    );
  }
}
