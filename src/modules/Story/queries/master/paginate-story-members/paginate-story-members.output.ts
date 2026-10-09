export class StoryMemberUserDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export class StoryMemberItemDto {
  id: string;
  status: number;
  createdAt: string;
  user: StoryMemberUserDto;
}

export class PaginateStoryMembersOutput {
  constructor(
    public readonly data: StoryMemberItemDto[],
    public readonly count: number,
  ) {}
}
