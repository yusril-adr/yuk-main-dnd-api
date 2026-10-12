import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { UnarchiveStoryCommand } from './unarchive-story.command';

@CommandHandler(UnarchiveStoryCommand)
export class UnarchiveStoryHandler implements ICommandHandler<UnarchiveStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: UnarchiveStoryCommand): Promise<void> {
    const { id, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanUnarchive(story, user)) {
      throw new ForbiddenException('Story cannot be unarchived');
    }

    story.status = story.statusBefore!;
    story.statusBefore = null;

    await this.storyRepository.save(story);
  }
}
