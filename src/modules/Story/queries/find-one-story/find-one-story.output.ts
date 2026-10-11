import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class FindOneStoryOutput extends StoryEntityDto {
  actionList: {
    isCanJoin: boolean;
    isCanCancelJoin: boolean;
  };

  constructor(
    payload: TStory,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
    isCanJoin: boolean,
    isCanCancelJoin: boolean,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.actionList = { isCanJoin, isCanCancelJoin };
  }
}
