import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventStatusEnum } from '../../../enums/event-status.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { ArchiveEventCommand } from './archive-event.command';

@CommandHandler(ArchiveEventCommand)
export class ArchiveEventHandler implements ICommandHandler<ArchiveEventCommand> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: ArchiveEventCommand): Promise<void> {
    const { id, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanArchive(event, user)) {
      throw new ForbiddenException('Event cannot be archived');
    }

    event.statusBefore = event.status;
    event.status = EventStatusEnum.ARCHIVED;

    await this.eventRepository.save(event);
  }
}
