import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource, IsNull, Not } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentConfigService } from '../../../services/story-comment-config.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { PinStoryCommentCommand } from './pin-story-comment.command';

@CommandHandler(PinStoryCommentCommand)
export class PinStoryCommentHandler implements ICommandHandler<PinStoryCommentCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentConfigService: StoryCommentConfigService,
    private readonly storyCommentActionService: StoryCommentActionService,
  ) {}

  async execute(command: PinStoryCommentCommand): Promise<void> {
    const { storyId, commentId, user } = command;

    const story = await this.storyCommentService.findStoryOrFail(storyId);
    // Permission only: pinning a pinned comment (or unpinning an unpinned one)
    // stays a no-op instead of an error.
    if (!this.storyCommentActionService.isCanManagePin(story, user)) {
      throw new ForbiddenException(
        'Your permission is not allowed to access this story',
      );
    }

    const maxPinned = this.storyCommentConfigService.maxPinnedCommentsPerStory;

    await this.dataSource.transaction(async (manager) => {
      // Lock the story row so concurrent pins on one story run one at a time.
      await manager
        .getRepository(Story)
        .createQueryBuilder('story')
        .setLock('pessimistic_write')
        .where('story.id = :id', { id: story.id })
        .getOne();

      const commentRepo = manager.getRepository(StoryComment);
      const comment = await this.storyCommentService.findCommentOrFail(
        story.id,
        commentId,
        manager,
      );
      if (comment.pinnedAt) {
        return;
      }

      // 0 means no limit.
      if (maxPinned > 0) {
        const pinned = await commentRepo.find({
          where: { story: { id: story.id }, pinnedAt: Not(IsNull()) },
          order: { pinnedAt: 'ASC', id: 'ASC' },
        });

        if (pinned.length >= maxPinned) {
          // With a single slot, pinning replaces the current pin. With more
          // slots, nothing is unpinned without the caller asking for it.
          if (maxPinned !== 1) {
            throw new BadRequestException(
              `A story can have at most ${maxPinned} pinned comments. Unpin one first.`,
            );
          }
          await commentRepo.update(
            pinned.map((item) => item.id),
            { pinnedAt: null },
          );
        }
      }

      await commentRepo.update(comment.id, {
        pinnedAt: new Date(),
      });
    });
  }
}
