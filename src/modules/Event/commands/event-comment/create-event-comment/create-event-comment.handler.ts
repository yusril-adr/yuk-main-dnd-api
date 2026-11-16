import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { EventCommentService } from '../../../services/event-comment.service';
import { EventCommentActionService } from '../../../services/event-comment-action.service';
import { CreateEventCommentCommand } from './create-event-comment.command';

@CommandHandler(CreateEventCommentCommand)
export class CreateEventCommentHandler implements ICommandHandler<CreateEventCommentCommand> {
  constructor(
    private readonly eventCommentService: EventCommentService,
    private readonly eventCommentActionService: EventCommentActionService,
    private readonly userRepository: UserRepository,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
  ) {}

  async execute(command: CreateEventCommentCommand): Promise<{ id: string }> {
    const { eventId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const event = await this.eventCommentService.findEventOrFail(eventId);

    if (!this.eventCommentActionService.isCanComment(event, user)) {
      throw new BadRequestException(
        'Comments can only be added to published or completed events',
      );
    }

    const comment = await this.eventCommentRepository.save(
      this.eventCommentRepository.create({
        event: { id: event.id },
        user: { id: user.id },
        content: payload.content,
      }),
    );

    return { id: comment.id };
  }
}
