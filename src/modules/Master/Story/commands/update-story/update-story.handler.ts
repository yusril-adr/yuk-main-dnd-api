import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../repositories/story.repository';
import { UpdateStoryCommand } from './update-story.command';

@CommandHandler(UpdateStoryCommand)
export class UpdateStoryHandler implements ICommandHandler<UpdateStoryCommand> {
  constructor(private readonly storyRepository: StoryRepository) {}

  async execute(command: UpdateStoryCommand): Promise<void> {
    const { id, params } = command;

    const storyEntity = await this.storyRepository.findOne({
      where: { id },
    });
    if (!storyEntity) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    const { startAt, ...storyPayload } = params;
    Object.assign(storyEntity, storyPayload);
    if (startAt !== undefined) {
      storyEntity.startAt = startAt === null ? null : new Date(startAt);
    }

    await this.storyRepository.save(storyEntity);
  }
}
