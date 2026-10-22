import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export type TStoryBoardDetailActionList = {
  isCanViewPublic: boolean;
};

export class FindOneStoryOutput extends StoryEntityDto {
  statusBefore: number | null;
  actionList: TStoryBoardDetailActionList;

  constructor(
    payload: TStory,
    actionList: TStoryBoardDetailActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
    this.actionList = actionList;
  }
}
