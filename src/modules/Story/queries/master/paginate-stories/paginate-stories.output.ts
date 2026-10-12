import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export type TStoryMasterActionList = {
  isCanCreate: boolean;
  isCanUpdate: boolean;
  isCanPublish: boolean;
  isCanCancel: boolean;
  isCanArchive: boolean;
  isCanUnarchive: boolean;
  isCanDelete: boolean;
  isCanAddMembers: boolean;
  isCanRemoveMembers: boolean;
};

export class PaginateStoriesItemOutput extends StoryEntityDto {
  statusBefore: number | null;
  actionList: TStoryMasterActionList;

  constructor(
    payload: TStory,
    actionList: TStoryMasterActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
    this.actionList = actionList;
  }
}

export class PaginateStoriesOutput {
  public readonly data: PaginateStoriesItemOutput[];
  public readonly count: number;

  constructor(
    stories: TStory[],
    bannerUrls: (string | null)[],
    avatarCreatorUrls: (string | null)[],
    actionLists: TStoryMasterActionList[],
    count: number,
  ) {
    this.data = stories.map(
      (story, i) =>
        new PaginateStoriesItemOutput(
          story,
          actionLists[i],
          bannerUrls[i],
          avatarCreatorUrls[i],
        ),
    );
    this.count = count;
  }
}
