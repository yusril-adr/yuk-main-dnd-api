import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export type TStoryMasterDetailActionList = {
  isCanUpdate: boolean;
  isCanPublish: boolean;
  isCanComplete: boolean;
  isCanCancel: boolean;
  isCanArchive: boolean;
  isCanUnarchive: boolean;
  isCanDelete: boolean;
  isCanAddMembers: boolean;
  isCanRemoveMembers: boolean;
  isCanViewPublic: boolean;
};

export class FindOneStoryOutput extends StoryEntityDto {
  statusBefore: number | null;
  actionList: TStoryMasterDetailActionList;

  constructor(
    payload: TStory,
    actionList: TStoryMasterDetailActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
    this.actionList = actionList;
  }
}
