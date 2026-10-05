import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StoryRepository } from '../../repositories/story.repository';
import { StoryService } from '../../services/story.service';
import { CreateStoryCommand } from './create-story.command';

@CommandHandler(CreateStoryCommand)
export class CreateStoryHandler implements ICommandHandler<CreateStoryCommand> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
  ) {}

  async execute(command: CreateStoryCommand): Promise<void> {
    const { params, user } = command;
    const slug = await this.storyService.generateUniqueSlug(params.title);
    const { startAt, ...storyPayload } = params;

    await this.storyRepository.save(
      this.storyRepository.create({
        ...storyPayload,
        ...(startAt !== undefined && { startAt: new Date(startAt) }),
        slug,
        createdBy: { id: user.id },
      }),
    );
  }
}
