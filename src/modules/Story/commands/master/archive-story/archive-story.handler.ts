import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { ArchiveStoryCommand } from './archive-story.command';

@CommandHandler(ArchiveStoryCommand)
export class ArchiveStoryHandler implements ICommandHandler<ArchiveStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyPermissionService: StoryPermissionService,
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

    this.storyPermissionService.assertCanModify(
      story,
      user,
      PermissionEnum.STORIES_UPDATE,
    );

    story.statusBefore = story.status;
    story.status = StoryStatusEnum.ARCHIVED;

    await this.storyRepository.save(story);
  }
}
