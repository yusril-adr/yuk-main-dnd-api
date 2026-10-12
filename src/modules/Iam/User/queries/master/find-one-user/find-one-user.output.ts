import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';
import type { TUserActionList } from '../../../types/user-action-list.type';

export class FindOneUserOutput extends UserEntityDto {
  actionList: TUserActionList;

  constructor(payload: TUser, actionList: TUserActionList, avatarUrl?: string) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.actionList = actionList;
  }
}
