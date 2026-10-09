import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { PublishStoryCommand } from './publish-story.command';

@CommandHandler(PublishStoryCommand)
export class PublishStoryHandler implements ICommandHandler<PublishStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyPermissionService: StoryPermissionService,
  ) {}

  async execute(command: PublishStoryCommand): Promise<void> {
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

    if (story.status !== StoryStatusEnum.DRAFT) {
      throw new BadRequestException('Only draft stories can be published');
    }

    story.statusBefore = story.status;
    story.status = StoryStatusEnum.PUBLISHED;

    await this.storyRepository.save(story);
  }
}
