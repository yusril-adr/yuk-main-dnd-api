import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class PaginateStoriesOutput {
  constructor(
    public readonly data: StoryEntityDto[],
    public readonly count: number,
  ) {}

  static from(data: TStory[], count: number): PaginateStoriesOutput {
    return new PaginateStoriesOutput(
      data.map((s) => new StoryEntityDto().parseEntity(s)),
      count,
    );
  }
}
