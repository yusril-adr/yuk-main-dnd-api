import type { TRole } from '@entities/main/iam/role.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export type TRoleDetailActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
};

export class FindOneRoleOutput extends RoleEntityDto {
  actionList: TRoleDetailActionList;

  constructor(payload: TRole, actionList: TRoleDetailActionList) {
    super();
    this.parseEntity(payload);
    this.actionList = actionList;
  }
}
