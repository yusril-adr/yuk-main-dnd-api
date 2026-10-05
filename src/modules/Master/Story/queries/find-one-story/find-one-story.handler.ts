import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../repositories/story.repository';
import { FindOneStoryQuery } from './find-one-story.query';
import { FindOneStoryOutput } from './find-one-story.output';

@QueryHandler(FindOneStoryQuery)
export class FindOneStoryHandler implements IQueryHandler<
  FindOneStoryQuery,
  FindOneStoryOutput
> {
  constructor(private readonly storyRepository: StoryRepository) {}

  async execute(query: FindOneStoryQuery): Promise<FindOneStoryOutput> {
    const { id } = query;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    return FindOneStoryOutput.from(story);
  }
}
