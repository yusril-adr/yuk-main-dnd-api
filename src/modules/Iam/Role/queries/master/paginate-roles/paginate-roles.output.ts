import type { TRole } from '@entities/main/iam/role.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export class PaginateRolesItemOutput extends RoleEntityDto {
  constructor(payload: TRole) {
    super();
    this.parseEntity(payload);
  }
}

export class PaginateRolesOutput {
  public readonly data: PaginateRolesItemOutput[];
  public readonly count: number;

  constructor(data: TRole[], count: number) {
    this.data = data.map((item) => new PaginateRolesItemOutput(item));
    this.count = count;
  }
}
