import { TStoryMemberUserDto } from '@shared/dtos/entities/story/story-member.entity.dto';

export class StoryMemberItemDto {
  id: string;
  status: number;
  createdAt: string;
  user: TStoryMemberUserDto;
}

export class PaginateStoryMembersOutput {
  constructor(
    public readonly data: StoryMemberItemDto[],
    public readonly count: number,
  ) {}
}
