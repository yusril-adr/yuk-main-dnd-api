import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { PUBLIC_STORY_STATUSES } from '../../../enums/story-status.enum';
import { StoryCommentService } from '../../../services/story-comment.service';
import { CreateStoryCommentCommand } from './create-story-comment.command';

@CommandHandler(CreateStoryCommentCommand)
export class CreateStoryCommentHandler implements ICommandHandler<CreateStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly userRepository: UserRepository,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(command: CreateStoryCommentCommand): Promise<{ id: string }> {
    const { storyId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const story = await this.storyCommentService.findStoryOrFail(storyId);

    // Comments are listed on the public story page, so only stories that
    // page shows (published or completed) accept new comments.
    if (!PUBLIC_STORY_STATUSES.includes(story.status)) {
      throw new BadRequestException(
        'Comments can only be added to published or completed stories',
      );
    }

    const comment = await this.storyCommentRepository.save(
      this.storyCommentRepository.create({
        story: { id: story.id },
        user: { id: user.id },
        content: payload.content,
      }),
    );

    return { id: comment.id };
  }
}
