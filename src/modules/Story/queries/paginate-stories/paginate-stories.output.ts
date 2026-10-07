import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class PaginateStoriesOutput {
  constructor(
    public readonly data: StoryEntityDto[],
    public readonly count: number,
  ) {}

  static from(
    data: {
      story: TStory;
      bannerUrl: string | null;
      avatarCreatorUrl: string | null;
    }[],
    count: number,
  ): PaginateStoriesOutput {
    return new PaginateStoriesOutput(
      data.map(({ story, bannerUrl, avatarCreatorUrl }) =>
        new StoryEntityDto().parseEntity(story, bannerUrl, avatarCreatorUrl),
      ),
      count,
    );
  }
}
