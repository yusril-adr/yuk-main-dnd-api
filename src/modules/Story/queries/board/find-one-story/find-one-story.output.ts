import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class FindOneStoryOutput extends StoryEntityDto {
  statusBefore: number | null;

  constructor(
    payload: TStory,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
  }
}
