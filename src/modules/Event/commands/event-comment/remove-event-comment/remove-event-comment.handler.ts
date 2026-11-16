import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentService } from '../../../services/event-comment.service';
import { EventCommentActionService } from '../../../services/event-comment-action.service';
import { RemoveEventCommentCommand } from './remove-event-comment.command';

@CommandHandler(RemoveEventCommentCommand)
export class RemoveEventCommentHandler implements ICommandHandler<RemoveEventCommentCommand> {
  constructor(
    private readonly eventCommentService: EventCommentService,
    private readonly eventCommentActionService: EventCommentActionService,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
  ) {}

  async execute(command: RemoveEventCommentCommand): Promise<void> {
    const { eventId, commentId, user } = command;

    const event = await this.eventCommentService.findEventOrFail(eventId);
    const comment = await this.eventCommentService.findCommentOrFail(
      event.id,
      commentId,
    );

    if (!this.eventCommentActionService.isCanDelete(comment, event, user)) {
      throw new ForbiddenException(
        'Your permission is not allowed to delete this comment',
      );
    }

    // Soft delete and clear the pin so a deleted comment never holds a slot.
    await this.eventCommentRepository.update(comment.id, {
      pinnedAt: null,
      deletedAt: new Date(),
    });
  }
}
