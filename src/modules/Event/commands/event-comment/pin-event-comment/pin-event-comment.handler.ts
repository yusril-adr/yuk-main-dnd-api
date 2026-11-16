import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource, IsNull, Not } from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentService } from '../../../services/event-comment.service';
import { EventCommentConfigService } from '../../../services/event-comment-config.service';
import { EventCommentActionService } from '../../../services/event-comment-action.service';
import { PinEventCommentCommand } from './pin-event-comment.command';

@CommandHandler(PinEventCommentCommand)
export class PinEventCommentHandler implements ICommandHandler<PinEventCommentCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventCommentService: EventCommentService,
    private readonly eventCommentConfigService: EventCommentConfigService,
    private readonly eventCommentActionService: EventCommentActionService,
  ) {}

  async execute(command: PinEventCommentCommand): Promise<void> {
    const { eventId, commentId, user } = command;

    const event = await this.eventCommentService.findEventOrFail(eventId);
    // Permission only: pinning a pinned comment (or unpinning an unpinned one)
    // stays a no-op instead of an error.
    if (!this.eventCommentActionService.hasPinPermission(event, user)) {
      throw new ForbiddenException(
        'Your permission is not allowed to access this event',
      );
    }

    const maxPinned = this.eventCommentConfigService.maxPinnedCommentsPerEvent;

    await this.dataSource.transaction(async (manager) => {
      // Lock the event row so concurrent pins on one event run one at a time.
      await manager
        .getRepository(Event)
        .createQueryBuilder('event')
        .setLock('pessimistic_write')
        .where('event.id = :id', { id: event.id })
        .getOne();

      const commentRepo = manager.getRepository(EventComment);
      const comment = await this.eventCommentService.findCommentOrFail(
        event.id,
        commentId,
        manager,
      );
      if (comment.parentId) {
        throw new BadRequestException('Replies cannot be pinned');
      }
      if (comment.pinnedAt) {
        return;
      }

      // 0 means no limit.
      if (maxPinned > 0) {
        const pinned = await commentRepo.find({
          where: { event: { id: event.id }, pinnedAt: Not(IsNull()) },
          order: { pinnedAt: 'ASC', id: 'ASC' },
        });

        if (pinned.length >= maxPinned) {
          // With a single slot, pinning replaces the current pin. With more
          // slots, nothing is unpinned without the caller asking for it.
          if (maxPinned !== 1) {
            throw new BadRequestException(
              `A event can have at most ${maxPinned} pinned comments. Unpin one first.`,
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
