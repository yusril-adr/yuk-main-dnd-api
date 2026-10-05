import type { TStory } from '@entities/main/story/story.entity';
import { StoryEntityDto } from '@shared/dtos/entities/story/story.entity.dto';

export class FindOneStoryOutput {
  constructor(public readonly data: StoryEntityDto) {}

  static from(data: TStory): FindOneStoryOutput {
    return new FindOneStoryOutput(new StoryEntityDto().parseEntity(data));
  }
}
