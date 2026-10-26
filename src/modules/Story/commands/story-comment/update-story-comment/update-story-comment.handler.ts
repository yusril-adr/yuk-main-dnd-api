import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { UpdateStoryCommentCommand } from './update-story-comment.command';

@CommandHandler(UpdateStoryCommentCommand)
export class UpdateStoryCommentHandler implements ICommandHandler<UpdateStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentActionService: StoryCommentActionService,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(command: UpdateStoryCommentCommand): Promise<void> {
    const { storyId, commentId, payload, user } = command;

    const story = await this.storyCommentService.findStoryOrFail(storyId);
    const comment = await this.storyCommentService.findCommentOrFail(
      story.id,
      commentId,
    );

    if (!this.storyCommentActionService.isCanUpdate(comment, user)) {
      throw new ForbiddenException('Only the author can edit this comment');
    }

    await this.storyCommentRepository.update(comment.id, {
      content: payload.content,
    });
  }
}
