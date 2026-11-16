import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

  async execute(
    command: CreateEventCommentCommand,
  ): Promise<{ id: string; parentId: string | null }> {
    const { eventId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const event = await this.eventCommentService.findEventOrFail(eventId);

    if (!this.eventCommentActionService.isCanComment(event, user)) {
      throw new BadRequestException(
        'Comments can only be added to published or completed events',
      );
    }

    const parentId = payload.parentId
      ? await this.resolveParentId(event.id, payload.parentId)
      : null;

    const comment = await this.eventCommentRepository.save(
      this.eventCommentRepository.create({
        event: { id: event.id },
        user: { id: user.id },
        parentId,
        content: payload.content,
      }),
    );

    return { id: comment.id, parentId };
  }

  // Returns the top-level comment the reply belongs under. The parent must
  // be a live comment of the same event; anything else is a 404.
  private async resolveParentId(
    eventId: string,
    parentId: string,
  ): Promise<string> {
    const notFound = new NotFoundException(
      `Comment with id ${parentId} not found`,
    );
    const parent = await this.eventCommentRepository.findOne({
      where: { id: parentId, event: { id: eventId } },
    });
    if (!parent) {
      throw notFound;
    }
    if (!parent.parentId) {
      return parent.id;
    }

    // Replies are one level deep: a reply to a reply joins the same thread,
    // which must itself still be live.
    const thread = await this.eventCommentRepository.findOne({
      where: { id: parent.parentId, event: { id: eventId } },
    });
    if (!thread) {
      throw notFound;
    }
    return thread.id;
  }
}
