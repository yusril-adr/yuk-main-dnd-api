import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { CreateStoryCommentCommand } from './create-story-comment.command';

@CommandHandler(CreateStoryCommentCommand)
export class CreateStoryCommentHandler implements ICommandHandler<CreateStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentActionService: StoryCommentActionService,
    private readonly userRepository: UserRepository,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(command: CreateStoryCommentCommand): Promise<{ id: string }> {
    const { storyId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const story = await this.storyCommentService.findStoryOrFail(storyId);

    if (!this.storyCommentActionService.isCanComment(story, user)) {
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
