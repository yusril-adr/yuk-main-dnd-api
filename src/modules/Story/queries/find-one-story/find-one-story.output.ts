import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class FindOneStoryOutput extends StoryEntityDto {
  actionList: {
    canJoin: boolean;
  };

  constructor(
    payload: TStory,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
    canJoin: boolean,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.actionList = { canJoin };
  }
}
