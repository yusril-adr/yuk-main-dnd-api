import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { UnpinStoryCommentCommand } from './unpin-story-comment.command';

@CommandHandler(UnpinStoryCommentCommand)
export class UnpinStoryCommentHandler implements ICommandHandler<UnpinStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentActionService: StoryCommentActionService,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(command: UnpinStoryCommentCommand): Promise<void> {
    const { storyId, commentId, user } = command;

    const story = await this.storyCommentService.findStoryOrFail(storyId);
    // Permission only: pinning a pinned comment (or unpinning an unpinned one)
    // stays a no-op instead of an error.
    if (!this.storyCommentActionService.isCanManagePin(story, user)) {
      throw new ForbiddenException(
        'Your permission is not allowed to access this story',
      );
    }

    const comment = await this.storyCommentService.findCommentOrFail(
      story.id,
      commentId,
    );
    if (!comment.pinnedAt) {
      return;
    }

    await this.storyCommentRepository.update(comment.id, {
      pinnedAt: null,
    });
  }
}
