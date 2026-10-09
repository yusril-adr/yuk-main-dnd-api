import { User } from '@entities/main/iam/user.entity';
import { TStoryMemberUserDto } from '@shared/dtos/entities/story/story-member.entity.dto';

export class PaginateAvailableStoryUsersOutput {
  constructor(
    public readonly data: TStoryMemberUserDto[],
    public readonly count: number,
  ) {}

  static from(
    users: User[],
    avatarUrls: (string | undefined)[],
    count: number,
  ): PaginateAvailableStoryUsersOutput {
    return new PaginateAvailableStoryUsersOutput(
      users.map((user, i) => ({
        id: user.id,
        displayName: user.displayName,
        avatarUrl: avatarUrls[i] ?? null,
      })),
      count,
    );
  }
}
