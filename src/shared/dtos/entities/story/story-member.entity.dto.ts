import { TStoryMember } from '@entities/main/story/story-member.entity';

export type TStoryMemberUserDto = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl?: string | null;
};

export type TStoryMemberEntityDto = Pick<TStoryMember, 'id' | 'status'> & {
  status: number;
  user: TStoryMemberUserDto;
};

export class StoryMemberEntityDto implements TStoryMemberEntityDto {
  id: string;
  status: number;
  user: TStoryMemberUserDto;

  parseEntity(
    storyMember: TStoryMember,
    avatarUrl?: string | null,
  ): StoryMemberEntityDto {
    this.id = storyMember.id;
    this.status = storyMember.status;
    this.user = {
      id: storyMember.user.id,
      displayName: storyMember.user.displayName,
      username: storyMember.user.username ?? null,
      avatarUrl: avatarUrl ?? null,
    };

    return this;
  }
}
