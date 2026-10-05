import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../repositories/story.repository';
import { RemoveStoryCommand } from './remove-story.command';

@CommandHandler(RemoveStoryCommand)
export class RemoveStoryHandler implements ICommandHandler<RemoveStoryCommand> {
  constructor(private readonly storyRepository: StoryRepository) {}

  async execute(command: RemoveStoryCommand): Promise<void> {
    const { id } = command;

    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    await this.storyRepository.softDelete(id);
  }
}
