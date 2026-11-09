import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { EventRepository } from '../../../repositories/event.repository';
import { EventService } from '../../../services/event.service';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { FindOneEventQuery } from './find-one-event.query';
import {
  FindOneEventOutput,
  TEventMasterDetailActionList,
} from './find-one-event.output';

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

    const actionList: TEventMasterDetailActionList = {
      isCanUpdate: this.eventMasterActionService.isCanUpdate(event, user),
      isCanPublish: this.eventMasterActionService.isCanPublish(event, user),
      isCanComplete: this.eventMasterActionService.isCanComplete(event, user),
      isCanCancel: this.eventMasterActionService.isCanCancel(event, user),
      isCanArchive: this.eventMasterActionService.isCanArchive(event, user),
      isCanUnarchive: this.eventMasterActionService.isCanUnarchive(event, user),
      isCanDelete: this.eventMasterActionService.isCanDelete(event, user),
      isCanAddMembers: this.eventMasterActionService.isCanAddMembers(
        event,
        user,
      ),
      isCanRemoveMembers: this.eventMasterActionService.isCanRemoveMembers(
        event,
        user,
      ),
      isCanViewPublic: this.eventMasterActionService.isCanViewPublic(event),
      isCanCreateGuestUser:
        this.eventMasterActionService.isCanCreateGuestUser(user),
    };

    return new FindOneEventOutput(
      event,
      actionList,
      this.eventService.resolveBannerUrl(event),
      this.eventService.resolveAvatarCreatorUrl(event),
    );
  }
}
