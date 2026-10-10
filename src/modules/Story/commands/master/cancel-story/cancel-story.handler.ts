import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryService } from '../../../services/story.service';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { CancelStoryCommand } from './cancel-story.command';

@CommandHandler(CancelStoryCommand)
export class CancelStoryHandler implements ICommandHandler<CancelStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
    private readonly storyPermissionService: StoryPermissionService,
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

    this.storyPermissionService.assertCanModify(
      story,
      user,
      PermissionEnum.STORIES_UPDATE,
    );

    if (this.storyService.isCancelledStory(story)) {
      throw new BadRequestException('Story is already cancelled');
    }
    if (story.status !== StoryStatusEnum.PUBLISHED) {
      throw new BadRequestException('Only published stories can be cancelled');
    }

    story.status = StoryStatusEnum.CANCELLED;
    story.statusBefore = null;

    await this.storyRepository.save(story);
  }
}
