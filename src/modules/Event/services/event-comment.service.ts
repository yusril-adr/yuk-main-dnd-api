import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { EntityManager, Repository } from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventRepository } from '../repositories/event.repository';

@Injectable()
export class EventCommentService {
  constructor(
    private readonly eventRepository: EventRepository,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
  ) {}

  async findEventOrFail(eventId: string): Promise<Event> {
    const event = isUUID(eventId)
      ? await this.eventRepository.findOne({
          where: { id: eventId },
          relations: { createdBy: true },
        })
      : null;
    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }
    return event;
  }

  async findCommentOrFail(
    eventId: string,
    commentId: string,
    manager?: EntityManager,
  ): Promise<EventComment> {
    const repository = manager
      ? manager.getRepository(EventComment)
      : this.eventCommentRepository;
    const comment = isUUID(commentId)
      ? await repository.findOne({
          where: { id: commentId, event: { id: eventId } },
          relations: { user: true },
        })
      : null;
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
    return comment;
  }
}
