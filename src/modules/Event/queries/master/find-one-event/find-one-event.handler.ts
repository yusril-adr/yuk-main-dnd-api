import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { EventRepository } from '../../../repositories/event.repository';
import { EventService } from '../../../services/event.service';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { FindOneEventQuery } from './find-one-event.query';
import { FindOneEventOutput } from './find-one-event.output';
import type { TEventMasterActionList } from '../paginate-events/paginate-events.output';

@QueryHandler(FindOneEventQuery)
export class FindOneEventHandler implements IQueryHandler<
  FindOneEventQuery,
  FindOneEventOutput
> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventService: EventService,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(query: FindOneEventQuery): Promise<FindOneEventOutput> {
    const { id, user } = query;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const actionList: TEventMasterActionList = {
      isCanUpdate: this.eventMasterActionService.isCanUpdate(event, user),
      isCanDelete: this.eventMasterActionService.isCanDelete(event, user),
      isCanViewPublic: this.eventMasterActionService.isCanViewPublic(event),
    };

    return new FindOneEventOutput(
      event,
      actionList,
      this.eventService.resolveBannerUrl(event),
      this.eventService.resolveAvatarCreatorUrl(event),
    );
  }
}
