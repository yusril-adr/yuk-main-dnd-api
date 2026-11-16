import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventCommentReaction } from '@entities/main/event/event-comment-reaction.entity';
import { EventCommentService } from '../../../services/event-comment.service';
import { RemoveEventCommentReactionCommand } from './remove-event-comment-reaction.command';

@CommandHandler(RemoveEventCommentReactionCommand)
export class RemoveEventCommentReactionHandler implements ICommandHandler<RemoveEventCommentReactionCommand> {
  constructor(
    private readonly eventCommentService: EventCommentService,
    @InjectRepository(EventCommentReaction)
    private readonly eventCommentReactionRepository: Repository<EventCommentReaction>,
  ) {}

  // Idempotent: removing a reaction that isn't there is still a success.
  // No event status check, so a reaction can always be taken back.
  async execute(command: RemoveEventCommentReactionCommand): Promise<void> {
    const { eventId, commentId, user } = command;

    const event = await this.eventCommentService.findEventOrFail(eventId);
    const comment = await this.eventCommentService.findCommentOrFail(
      event.id,
      commentId,
    );

    await this.eventCommentReactionRepository.delete({
      comment: { id: comment.id },
      user: { id: user.id },
    });
  }
}
