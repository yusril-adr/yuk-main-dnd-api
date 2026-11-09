import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventStatusEnum } from '../../../enums/event-status.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { CancelEventCommand } from './cancel-event.command';

@CommandHandler(CancelEventCommand)
export class CancelEventHandler implements ICommandHandler<CancelEventCommand> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: CancelEventCommand): Promise<void> {
    const { id, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanCancel(event, user)) {
      throw new ForbiddenException('Event cannot be cancelled');
    }

    event.status = EventStatusEnum.CANCELLED;
    event.statusBefore = null;

    await this.eventRepository.save(event);
  }
}
