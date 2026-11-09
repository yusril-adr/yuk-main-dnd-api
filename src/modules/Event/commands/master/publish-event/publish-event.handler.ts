import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventStatusEnum } from '../../../enums/event-status.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { PublishEventCommand } from './publish-event.command';

@CommandHandler(PublishEventCommand)
export class PublishEventHandler implements ICommandHandler<PublishEventCommand> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: PublishEventCommand): Promise<void> {
    const { id, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanPublish(event, user)) {
      throw new ForbiddenException('Event cannot be published');
    }

    event.statusBefore = event.status;
    event.status = EventStatusEnum.PUBLISHED;

    await this.eventRepository.save(event);
  }
}
