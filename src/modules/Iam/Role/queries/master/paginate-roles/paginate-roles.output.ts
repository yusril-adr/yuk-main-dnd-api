import type { TRole } from '@entities/main/iam/role.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';

export type TRoleActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
};

export class PaginateRolesItemOutput extends RoleEntityDto {
  actionList: TRoleActionList;

  constructor(payload: TRole, actionList: TRoleActionList) {
    super();
    this.parseEntity(payload);
    this.actionList = actionList;
  }
}

export class PaginateRolesOutput {
  public readonly data: PaginateRolesItemOutput[];
  public readonly count: number;

  constructor(data: TRole[], actionList: TRoleActionList, count: number) {
    this.data = data.map(
      (item) => new PaginateRolesItemOutput(item, actionList),
    );
    this.count = count;
  }
}
