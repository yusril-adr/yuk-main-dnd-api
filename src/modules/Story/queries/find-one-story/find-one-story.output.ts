import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export type TStoryDetailActionList = {
  isCanJoin: boolean;
  isCanCancelJoin: boolean;
};

export class FindOneStoryOutput extends StoryEntityDto {
  actionList: TStoryDetailActionList;

  constructor(
    payload: TStory,
    actionList: TStoryDetailActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.actionList = actionList;
  }
}
