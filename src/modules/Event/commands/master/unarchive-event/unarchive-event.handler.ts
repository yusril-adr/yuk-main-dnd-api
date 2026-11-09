import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { UnarchiveEventCommand } from './unarchive-event.command';

@CommandHandler(UnarchiveEventCommand)
export class UnarchiveEventHandler implements ICommandHandler<UnarchiveEventCommand> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: UnarchiveEventCommand): Promise<void> {
    const { id, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanUnarchive(event, user)) {
      throw new ForbiddenException('Event cannot be unarchived');
    }

    event.status = event.statusBefore!;
    event.statusBefore = null;

    await this.eventRepository.save(event);
  }
}
