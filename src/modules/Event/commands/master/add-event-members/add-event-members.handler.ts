import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventMember } from '@entities/main/event/event-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { EventMemberStatusEnum } from '../../../enums/event-member-status.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { AddEventMembersCommand } from './add-event-members.command';

@CommandHandler(AddEventMembersCommand)
export class AddEventMembersHandler implements ICommandHandler<AddEventMembersCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventRepository: EventRepository,
    private readonly userRepository: UserRepository,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: AddEventMembersCommand): Promise<void> {
    const { id, params, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanAddMembers(event, user)) {
      throw new ForbiddenException('Event members cannot be added');
    }

    const uniqueUserIds = [...new Set(params.userIds)];
    await this.userRepository.findAndValidateUserByIds(uniqueUserIds);

    await this.dataSource.transaction(async (manager) => {
      const eventMemberRepo = manager.getRepository(EventMember);
      const existingMembers = await eventMemberRepo.find({
        where: uniqueUserIds.map((userId) => ({
          event: { id },
          user: { id: userId },
        })),
        relations: { user: true },
        withDeleted: true,
      });

      const activeMembers = existingMembers.filter(
        (member) => member.deletedAt == null,
      );
      if (activeMembers.length) {
        const activeMemberIds = activeMembers.map((member) => member.user.id);
        throw new ConflictException(
          `User with id ${activeMemberIds.join(', ')} is already a member of this event`,
        );
      }

      const softDeletedMembers = existingMembers.filter(
        (member) => member.deletedAt != null,
      );
      if (softDeletedMembers.length) {
        for (const member of softDeletedMembers) {
          member.status = EventMemberStatusEnum.REGISTERED;
        }
        await eventMemberRepo.recover(softDeletedMembers);
        await eventMemberRepo.save(softDeletedMembers);
      }

      const existingUserIds = new Set(
        existingMembers.map((member) => member.user.id),
      );
      const newMembers = uniqueUserIds
        .filter((userId) => !existingUserIds.has(userId))
        .map((userId) =>
          eventMemberRepo.create({
            event: { id },
            user: { id: userId },
            status: EventMemberStatusEnum.REGISTERED,
          }),
        );
      if (newMembers.length) {
        await eventMemberRepo.save(newMembers);
      }
    });
  }
}
