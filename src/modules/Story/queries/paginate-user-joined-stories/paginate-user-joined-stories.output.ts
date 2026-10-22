import { TStory } from '@entities/main/story/story.entity';
import type {
  TStoryCreatorDto,
  TStoryEntityDto,
} from '@shared/dtos/entities/story/story.entity.dto';

type TPaginateUserJoinedStoriesItemOutput = Omit<
  TStoryEntityDto,
  'expAwarded' | 'pointAwarded' | 'locationDetail' | 'updatedAt'
> & {
  joinedMembers: number;
  memberStatus: number;
};

export class PaginateUserJoinedStoriesItemOutput implements TPaginateUserJoinedStoriesItemOutput {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: number;
  type: number;
  gameSystem?: string;
  discordChannelLink: string | null;
  locationLink: string | null;
  maxMembers?: number;
  joinedMembers: number;
  memberStatus: number;
  startAt: string | null;
  locationType: number;
  bannerUrl: string | null;
  createdBy?: TStoryCreatorDto;
  createdAt: string;

  constructor(
    payload: TStory,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
    joinedMembers: number,
    memberStatus: number,
  ) {
    this.id = payload.id;
    this.title = payload.title;
    this.slug = payload.slug;
    this.description = payload.description;
    this.status = payload.status;
    this.type = payload.type;
    this.gameSystem = payload.gameSystem;
    this.discordChannelLink = payload.discordChannelLink ?? null;
    this.locationLink = payload.locationLink ?? null;
    this.maxMembers = payload.maxMembers;
    this.joinedMembers = joinedMembers;
    this.memberStatus = memberStatus;
    this.startAt = payload.startAt ? payload.startAt.toISOString() : null;
    this.locationType = payload.locationType;
    this.bannerUrl = bannerUrl ?? null;
    if (payload.createdBy) {
      this.createdBy = {
        id: payload.createdBy.id,
        displayName: payload.createdBy.displayName,
        avatarUrl: avatarCreatorUrl,
      };
    }
    this.createdAt = payload.createdAt.toISOString();
  }
}

export class PaginateUserJoinedStoriesOutput {
  public readonly data: PaginateUserJoinedStoriesItemOutput[];
  public readonly count: number;

  constructor(
    stories: TStory[],
    bannerUrls: (string | null)[],
    avatarCreatorUrls: (string | null)[],
    currentMemberCounts: number[],
    memberStatuses: number[],
    count: number,
  ) {
    this.data = stories.map(
      (story, i) =>
        new PaginateUserJoinedStoriesItemOutput(
          story,
          bannerUrls[i],
          avatarCreatorUrls[i],
          currentMemberCounts[i],
          memberStatuses[i],
        ),
    );
    this.count = count;
  }
}
