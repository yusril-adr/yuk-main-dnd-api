import type { TStory } from '@entities/main/story/story.entity';
import dayjs from '@shared/utils/dayjs';

export type TStoryCreatorDto = {
  id: string;
  displayName: string;
};

export type TStoryEntityDto = Omit<
  TStory,
  | 'createdBy'
  | 'bannerFile'
  | 'startAt'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
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
  status: string;
  type: string;
  gameSystem?: string;
  maxMembers?: number;
  startAt: string | null;
  locationType: string;
  locationDetail: string;
  bannerUrl: string | null;
  createdBy?: TStoryCreatorDto;
  createdAt: string;
  updatedAt: string;

  parseEntity(story: TStory, bannerUrl?: string | null): StoryEntityDto {
    this.id = story.id;
    this.title = story.title;
    this.slug = story.slug;
    this.description = story.description;
    this.status = story.status;
    this.type = story.type;
    this.gameSystem = story.gameSystem;
    this.maxMembers = story.maxMembers;
    this.startAt = story.startAt ? dayjs(story.startAt).toISOString() : null;
    this.locationType = story.locationType;
    this.locationDetail = story.locationDetail;
    this.bannerUrl = bannerUrl ?? null;
    if (story.createdBy) {
      this.createdBy = {
        id: story.createdBy.id,
        displayName: story.createdBy.displayName,
      };
    }
    this.createdAt = dayjs(story.createdAt).toISOString();
    this.updatedAt = dayjs(story.updatedAt).toISOString();

    return this;
  }
}
