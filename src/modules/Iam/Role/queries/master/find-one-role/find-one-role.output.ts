import type { TRole } from '@entities/main/iam/role.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export class FindOneRoleOutput extends RoleEntityDto {
  constructor(payload: TRole) {
    super();
    this.parseEntity(payload);
  }
}
