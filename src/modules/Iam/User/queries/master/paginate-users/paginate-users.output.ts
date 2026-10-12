import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';
import type { TUserActionList } from '../../../types/user-action-list.type';

export class PaginateUsersItemOutput extends UserEntityDto {
  actionList: TUserActionList;

  constructor(payload: TUser, actionList: TUserActionList, avatarUrl?: string) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.actionList = actionList;
  }
}

export class PaginateUsersOutput {
  public readonly data: PaginateUsersItemOutput[];
  public readonly count: number;

  constructor(
    users: TUser[],
    avatarUrls: (string | undefined)[],
    actionList: TUserActionList,
    count: number,
  ) {
    this.data = users.map(
      (user, i) => new PaginateUsersItemOutput(user, actionList, avatarUrls[i]),
    );
    this.count = count;
  }
}
