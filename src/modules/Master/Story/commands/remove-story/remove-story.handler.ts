import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryRepository } from '../../repositories/story.repository';
import { StoryPermissionService } from '../../services/story-permission.service';
import { RemoveStoryCommand } from './remove-story.command';

@CommandHandler(RemoveStoryCommand)
export class RemoveStoryHandler implements ICommandHandler<RemoveStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyPermissionService: StoryPermissionService,
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

    this.storyPermissionService.assertCanModify(
      story,
      user,
      PermissionEnum.STORIES_DELETE,
    );

    await this.storyRepository.softDelete(id);
  }
}
