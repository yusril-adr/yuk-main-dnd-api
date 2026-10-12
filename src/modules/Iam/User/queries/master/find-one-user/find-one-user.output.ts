import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export type TUserDetailActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isCanViewBalances: boolean;
  isCanCreateBalances: boolean;
};

export class FindOneUserOutput extends UserEntityDto {
  actionList: TUserDetailActionList;

  constructor(
    payload: TUser,
    actionList: TUserDetailActionList,
    avatarUrl?: string,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.actionList = actionList;
  }
}
