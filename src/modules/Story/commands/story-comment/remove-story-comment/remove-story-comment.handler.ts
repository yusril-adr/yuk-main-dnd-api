import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { RemoveStoryCommentCommand } from './remove-story-comment.command';

@CommandHandler(RemoveStoryCommentCommand)
export class RemoveStoryCommentHandler implements ICommandHandler<RemoveStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentActionService: StoryCommentActionService,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(command: RemoveStoryCommentCommand): Promise<void> {
    const { storyId, commentId, user } = command;

    const story = await this.storyCommentService.findStoryOrFail(storyId);
    const comment = await this.storyCommentService.findCommentOrFail(
      story.id,
      commentId,
    );

    if (!this.storyCommentActionService.isCanDelete(comment, story, user)) {
      throw new ForbiddenException(
        'Your permission is not allowed to delete this comment',
      );
    }

    // Soft delete and clear the pin so a deleted comment never holds a slot.
    await this.storyCommentRepository.update(comment.id, {
      pinnedAt: null,
      deletedAt: new Date(),
    });
  }
}
