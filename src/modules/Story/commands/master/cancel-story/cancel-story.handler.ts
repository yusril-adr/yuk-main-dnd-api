import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { CancelStoryCommand } from './cancel-story.command';

@CommandHandler(CancelStoryCommand)
export class CancelStoryHandler implements ICommandHandler<CancelStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: CancelStoryCommand): Promise<void> {
    const { id, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanCancel(story, user)) {
      throw new ForbiddenException('Story cannot be cancelled');
    }

    story.status = StoryStatusEnum.CANCELLED;
    story.statusBefore = null;

    await this.storyRepository.save(story);
  }
}
