import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export class GetAvailableStoryUsersOutput {
  constructor(
    public readonly data: UserEntityDto[],
    public readonly count: number,
  ) {}

  static from(
    users: TUser[],
    avatarUrls: (string | undefined)[],
    count: number,
  ): GetAvailableStoryUsersOutput {
    return new GetAvailableStoryUsersOutput(
      users.map((u, i) => new UserEntityDto().parseEntity(u, avatarUrls[i])),
      count,
    );
  }
}
