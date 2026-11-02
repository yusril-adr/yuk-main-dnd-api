import type { TStory } from '@entities/main/story/story.entity';
import dayjs from '@shared/utils/dayjs';

export type TStoryCreatorDto = {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
};

export type TStoryEntityDto = Omit<
  TStory,
  | 'createdBy'
  | 'bannerFile'
  | 'startAt'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'storyMembers'
  | 'statusBefore'
> & {
  createdBy?: TStoryCreatorDto;
  bannerUrl: string | null;
  startAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class StoryEntityDto implements TStoryEntityDto {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: number;
  type: number;
  gameSystem?: string;
  discordChannelLink: string | null;
  locationLink: string | null;
  feedbackFormLink: string | null;
  expAwarded: number;
  pointAwarded: number;
  maxMembers?: number;
  startAt: string | null;
  locationType: number;
  locationDetail: string;
  bannerUrl: string | null;
  createdBy?: TStoryCreatorDto;
  createdAt: string;
  updatedAt: string;

  parseEntity(
    story: TStory,
    bannerUrl?: string | null,
    avatarCreatorUrl?: string | null,
  ): StoryEntityDto {
    this.id = story.id;
    this.title = story.title;
    this.slug = story.slug;
    this.description = story.description;
    this.status = story.status;
    this.type = story.type;
    this.gameSystem = story.gameSystem;
    this.discordChannelLink = story.discordChannelLink ?? null;
    this.locationLink = story.locationLink ?? null;
    this.feedbackFormLink = story.feedbackFormLink ?? null;
    this.expAwarded = story.expAwarded;
    this.pointAwarded = story.pointAwarded;
    this.maxMembers = story.maxMembers;
    this.startAt = story.startAt ? dayjs(story.startAt).toISOString() : null;
    this.locationType = story.locationType;
    this.locationDetail = story.locationDetail;
    this.bannerUrl = bannerUrl ?? null;
    if (story.createdBy) {
      this.createdBy = {
        id: story.createdBy.id,
        displayName: story.createdBy.displayName,
        username: story.createdBy.username ?? null,
        avatarUrl: avatarCreatorUrl,
      };
    }
    this.createdAt = dayjs(story.createdAt).toISOString();
    this.updatedAt = dayjs(story.updatedAt).toISOString();

    return this;
  }
}
