import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export class PaginateUsersItemOutput extends UserEntityDto {
  constructor(payload: TUser, avatarUrl?: string) {
    super();
    this.parseEntity(payload, avatarUrl);
  }
}

export class PaginateUsersOutput {
  public readonly data: PaginateUsersItemOutput[];
  public readonly count: number;

  constructor(
    users: TUser[],
    avatarUrls: (string | undefined)[],
    count: number,
  ) {
    this.data = users.map(
      (user, i) => new PaginateUsersItemOutput(user, avatarUrls[i]),
    );
    this.count = count;
  }
}
