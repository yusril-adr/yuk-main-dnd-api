import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class PaginateStoriesItemOutput extends StoryEntityDto {
  constructor(
    payload: TStory,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
  }
}

export class PaginateStoriesOutput {
  public readonly data: PaginateStoriesItemOutput[];
  public readonly count: number;

  constructor(
    stories: TStory[],
    bannerUrls: (string | null)[],
    avatarCreatorUrls: (string | null)[],
    count: number,
  ) {
    this.data = stories.map(
      (story, i) =>
        new PaginateStoriesItemOutput(
          story,
          bannerUrls[i],
          avatarCreatorUrls[i],
        ),
    );
    this.count = count;
  }
}
