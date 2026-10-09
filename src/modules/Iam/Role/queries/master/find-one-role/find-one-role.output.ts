import type { TRole } from '@entities/main/iam/role.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export class FindOneRoleOutput {
  constructor(public readonly data: RoleEntityDto) {}

  static from(data: TRole): FindOneRoleOutput {
    return new FindOneRoleOutput(new RoleEntityDto().parseEntity(data));
  }
}
