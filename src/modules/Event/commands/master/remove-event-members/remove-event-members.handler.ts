import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventMember } from '@entities/main/event/event-member.entity';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { RemoveEventMembersCommand } from './remove-event-members.command';

@CommandHandler(RemoveEventMembersCommand)
export class RemoveEventMembersHandler implements ICommandHandler<RemoveEventMembersCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventRepository: EventRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: RemoveEventMembersCommand): Promise<void> {
    const { id, params, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanRemoveMembers(event, user)) {
      throw new ForbiddenException('Event members cannot be removed');
    }

    const uniqueUserIds = [...new Set(params.userIds)];

    await this.dataSource.transaction(async (manager) => {
      const eventMemberRepo = manager.getRepository(EventMember);
      const members = await eventMemberRepo.find({
        where: uniqueUserIds.map((userId) => ({
          event: { id },
          user: { id: userId },
        })),
        relations: { user: true },
        withDeleted: true,
      });

      const activeMembers = members.filter(
        (member) => member.deletedAt == null,
      );
      const foundUserIds = new Set(
        activeMembers.map((member) => member.user.id),
      );
      const missingIds = uniqueUserIds.filter(
        (userId) => !foundUserIds.has(userId),
      );
      if (missingIds.length) {
        throw new NotFoundException(
          `User with id ${missingIds.join(', ')} is not a member of this event`,
        );
      }

      await eventMemberRepo.softRemove(activeMembers);
    });
  }
}
