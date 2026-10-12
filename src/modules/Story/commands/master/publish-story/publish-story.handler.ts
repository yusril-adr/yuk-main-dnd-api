import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { PublishStoryCommand } from './publish-story.command';

@CommandHandler(PublishStoryCommand)
export class PublishStoryHandler implements ICommandHandler<PublishStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
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

    if (!this.storyMasterActionService.isCanPublish(story, user)) {
      throw new ForbiddenException('Story cannot be published');
    }

    story.statusBefore = story.status;
    story.status = StoryStatusEnum.PUBLISHED;

    await this.storyRepository.save(story);
  }
}
