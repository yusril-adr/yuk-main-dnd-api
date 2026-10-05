import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../repositories/story.repository';
import { StoryService } from '../../services/story.service';
import { FindOneStoryQuery } from './find-one-story.query';
import { FindOneStoryOutput } from './find-one-story.output';

@QueryHandler(FindOneStoryQuery)
export class FindOneStoryHandler implements IQueryHandler<
  FindOneStoryQuery,
  FindOneStoryOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
  ) {}

  async execute(query: FindOneStoryQuery): Promise<FindOneStoryOutput> {
    const { id } = query;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    return FindOneStoryOutput.from(
      story,
      this.storyService.resolveBannerUrl(story),
      this.storyService.resolveAvatarCreatorUrl(story),
    );
  }
}
