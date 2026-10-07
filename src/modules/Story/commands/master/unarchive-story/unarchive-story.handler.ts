import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { UnarchiveStoryCommand } from './unarchive-story.command';

@CommandHandler(UnarchiveStoryCommand)
export class UnarchiveStoryHandler implements ICommandHandler<UnarchiveStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyPermissionService: StoryPermissionService,
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

    this.storyPermissionService.assertCanModify(
      story,
      user,
      PermissionEnum.STORIES_UPDATE,
    );

    if (!story.statusBefore) {
      throw new BadRequestException(
        'Story has no previous status to restore to',
      );
    }

    story.status = story.statusBefore;
    story.statusBefore = null;

    await this.storyRepository.save(story);
  }
}