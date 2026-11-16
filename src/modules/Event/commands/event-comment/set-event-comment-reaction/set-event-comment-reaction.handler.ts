import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventCommentReaction } from '@entities/main/event/event-comment-reaction.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { EventCommentService } from '../../../services/event-comment.service';
import { EventCommentActionService } from '../../../services/event-comment-action.service';
import { SetEventCommentReactionCommand } from './set-event-comment-reaction.command';

@CommandHandler(SetEventCommentReactionCommand)
export class SetEventCommentReactionHandler implements ICommandHandler<SetEventCommentReactionCommand> {
  constructor(
    private readonly eventCommentService: EventCommentService,
    private readonly eventCommentActionService: EventCommentActionService,
    private readonly userRepository: UserRepository,
    @InjectRepository(EventCommentReaction)
    private readonly eventCommentReactionRepository: Repository<EventCommentReaction>,
  ) {}

  async execute(command: SetEventCommentReactionCommand): Promise<void> {
    const { eventId, commentId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const event = await this.eventCommentService.findEventOrFail(eventId);
    const comment = await this.eventCommentService.findCommentOrFail(
      event.id,
      commentId,
    );

    if (!this.eventCommentActionService.isCanReact(comment, event, user)) {
      throw new BadRequestException(
        'Reactions can only be added on published or completed events',
      );
    }

    // One reaction per user per comment: insert, or switch the type. Sending
    // the same type again changes nothing.
    await this.eventCommentReactionRepository
      .createQueryBuilder()
      .insert()
      .into(EventCommentReaction)
      .values({
        comment: { id: comment.id },
        user: { id: user.id },
        type: payload.type,
      })
      .orUpdate(['type', 'updated_at'], ['comment_id', 'user_id'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .execute();
  }
}
