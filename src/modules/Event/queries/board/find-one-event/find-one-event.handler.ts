import { NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMember } from '@entities/main/event/event-member.entity';
import { EventService } from '../../../services/event.service';
import { FindOneEventQuery } from './find-one-event.query';
import {
  FindOneEventOutput,
  TEventBoardDetailActionList,
} from './find-one-event.output';

@QueryHandler(FindOneEventQuery)
export class FindOneEventHandler implements IQueryHandler<
  FindOneEventQuery,
  FindOneEventOutput
> {
  constructor(
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
    private readonly eventService: EventService,
  ) {}

  async execute(query: FindOneEventQuery): Promise<FindOneEventOutput> {
    const { id, user } = query;

    const membership = await this.eventMemberRepository.findOne({
      where: {
        user: { id: user.id },
        event: { id },
      },
      relations: {
        event: { createdBy: { avatarFile: true }, bannerFile: true },
      },
    });
    if (!membership?.event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const event = membership.event;
    const actionList: TEventBoardDetailActionList = {
      isCanViewPublic: this.eventService.isCanViewPublic(event),
    };

    return new FindOneEventOutput(
      event,
      actionList,
      this.eventService.resolveBannerUrl(event),
      this.eventService.resolveAvatarCreatorUrl(event),
    );
  }
}
