import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { RemoveStoryCommand } from './remove-story.command';

@CommandHandler(RemoveStoryCommand)
export class RemoveStoryHandler implements ICommandHandler<RemoveStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: RemoveStoryCommand): Promise<void> {
    const { id, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanDelete(story, user)) {
      throw new ForbiddenException('Story cannot be deleted');
    }

    await this.storyRepository.softDelete(id);
  }
}
