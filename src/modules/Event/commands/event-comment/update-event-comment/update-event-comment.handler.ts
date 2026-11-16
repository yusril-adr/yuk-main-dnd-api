import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentService } from '../../../services/event-comment.service';
import { EventCommentActionService } from '../../../services/event-comment-action.service';
import { UpdateEventCommentCommand } from './update-event-comment.command';

@CommandHandler(UpdateEventCommentCommand)
export class UpdateEventCommentHandler implements ICommandHandler<UpdateEventCommentCommand> {
  constructor(
    private readonly eventCommentService: EventCommentService,
    private readonly eventCommentActionService: EventCommentActionService,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
  ) {}

  async execute(command: UpdateEventCommentCommand): Promise<void> {
    const { eventId, commentId, payload, user } = command;

    const event = await this.eventCommentService.findEventOrFail(eventId);
    const comment = await this.eventCommentService.findCommentOrFail(
      event.id,
      commentId,
    );

    if (!this.eventCommentActionService.isCanUpdate(comment, user)) {
      throw new ForbiddenException('Only the author can edit this comment');
    }

    await this.eventCommentRepository.update(comment.id, {
      content: payload.content,
    });
  }
}
