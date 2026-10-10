import type { TStoryMember } from '@entities/main/story/story-member.entity';
import { StoryMemberEntityDto } from '@shared/dtos/entities/story/story-member.entity.dto';
import dayjs from '@shared/utils/dayjs';

export class PaginateStoryMembersItemOutput extends StoryMemberEntityDto {
  createdAt: string;

  constructor(payload: TStoryMember, avatarUrl?: string | null) {
    super();
    this.parseEntity(payload, avatarUrl);
    if (payload.user.deletedAt) {
      this.user = {
        ...this.user,
        displayName: `${payload.user.displayName} (Deleted User)`,
      };
    }
    this.createdAt = dayjs(payload.createdAt).toISOString();
  }
}

export class PaginateStoryMembersOutput {
  public readonly data: PaginateStoryMembersItemOutput[];
  public readonly count: number;

  constructor(
    members: TStoryMember[],
    avatarUrls: (string | null)[],
    count: number,
  ) {
    this.data = members.map(
      (member, i) => new PaginateStoryMembersItemOutput(member, avatarUrls[i]),
    );
    this.count = count;
  }
}
