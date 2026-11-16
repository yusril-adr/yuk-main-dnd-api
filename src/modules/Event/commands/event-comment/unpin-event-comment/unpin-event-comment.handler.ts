import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentService } from '../../../services/event-comment.service';
import { EventCommentActionService } from '../../../services/event-comment-action.service';
import { UnpinEventCommentCommand } from './unpin-event-comment.command';

@CommandHandler(UnpinEventCommentCommand)
export class UnpinEventCommentHandler implements ICommandHandler<UnpinEventCommentCommand> {
  constructor(
    private readonly eventCommentService: EventCommentService,
    private readonly eventCommentActionService: EventCommentActionService,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
  ) {}

  async execute(command: UnpinEventCommentCommand): Promise<void> {
    const { eventId, commentId, user } = command;

    const event = await this.eventCommentService.findEventOrFail(eventId);
    // Permission only: pinning a pinned comment (or unpinning an unpinned one)
    // stays a no-op instead of an error.
    if (!this.eventCommentActionService.hasPinPermission(event, user)) {
      throw new ForbiddenException(
        'Your permission is not allowed to access this event',
      );
    }

    const comment = await this.eventCommentService.findCommentOrFail(
      event.id,
      commentId,
    );
    if (!comment.pinnedAt) {
      return;
    }

    await this.eventCommentRepository.update(comment.id, {
      pinnedAt: null,
    });
  }
}
