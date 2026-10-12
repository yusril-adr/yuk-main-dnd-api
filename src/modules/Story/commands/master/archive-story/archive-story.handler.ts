import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { ArchiveStoryCommand } from './archive-story.command';

@CommandHandler(ArchiveStoryCommand)
export class ArchiveStoryHandler implements ICommandHandler<ArchiveStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: ArchiveStoryCommand): Promise<void> {
    const { id, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanArchive(story, user)) {
      throw new ForbiddenException('Story cannot be archived');
    }

    story.statusBefore = story.status;
    story.status = StoryStatusEnum.ARCHIVED;

    await this.storyRepository.save(story);
  }
}
