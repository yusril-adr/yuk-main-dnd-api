import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { RemoveEventCommand } from './remove-event.command';

@CommandHandler(RemoveEventCommand)
export class RemoveEventHandler implements ICommandHandler<RemoveEventCommand> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: RemoveEventCommand): Promise<void> {
    const { id, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanDelete(event, user)) {
      throw new ForbiddenException('Event cannot be deleted');
    }

    await this.eventRepository.softDelete(id);
  }
}
