import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEntity } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { UserBalanceService } from '@modules/Iam/User/services/user-balance.service';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';
import { EventMemberStatusEnum } from '../../../enums/event-member-status.enum';
import { EventStatusEnum } from '../../../enums/event-status.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { CompleteEventCommand } from './complete-event.command';

@CommandHandler(CompleteEventCommand)
export class CompleteEventHandler implements ICommandHandler<CompleteEventCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventRepository: EventRepository,
    private readonly userRepository: UserRepository,
    private readonly eventMasterActionService: EventMasterActionService,
    private readonly userBalanceService: UserBalanceService,
  ) {}

  async execute(command: CompleteEventCommand): Promise<void> {
    const { id, params, user } = command;

    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanComplete(event, user)) {
      throw new ForbiddenException('Event cannot be completed');
    }

    const uniqueUserIds = [...new Set(params.userIds)];
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('At least one attended member is required');
    }
    await this.userRepository.findAndValidateUserByIds(uniqueUserIds);
    if (event.maxMembers != null && uniqueUserIds.length > event.maxMembers) {
      throw new BadRequestException(
        `Attended members must not exceed max members of ${event.maxMembers}`,
      );
    }
    if (event.expAwarded < 0) {
      throw new BadRequestException('Event experience award is invalid');
    }
    if (event.pointAwarded < 0) {
      throw new BadRequestException('Event point award is invalid');
    }

    await this.dataSource.transaction(async (manager) => {
      const eventMemberRepo = manager.getRepository(EventMember);
      const members = await eventMemberRepo.find({
        where: { event: { id } },
        relations: { user: true },
      });

      const memberUserIds = new Set(members.map((member) => member.user.id));
      const missingIds = uniqueUserIds.filter(
        (userId) => !memberUserIds.has(userId),
      );
      if (missingIds.length) {
        throw new NotFoundException(
          `User with id ${missingIds.join(', ')} is not a member of this event`,
        );
      }

      const attendedUserIds = new Set(uniqueUserIds);
      for (const member of members) {
        member.status = attendedUserIds.has(member.user.id)
          ? EventMemberStatusEnum.ATTENDED
          : EventMemberStatusEnum.ABSENT;
      }
      if (members.length) {
        await eventMemberRepo.save(members);
      }

      // Guests do not earn EXP or points from event completion.
      const nonGuestMemberIds = new Set(
        members.filter((m) => !m.user.isGuest).map((m) => m.user.id),
      );
      const rewardUserIds = uniqueUserIds.filter((userId) =>
        nonGuestMemberIds.has(userId),
      );

      const rewardDescription = `Player reward for event ${event.title}`;
      if (event.expAwarded > 0 && rewardUserIds.length > 0) {
        await this.userBalanceService.addExperiencePointsToMany(
          {
            userIds: rewardUserIds,
            type: UserExpLogTypeEnum.PLAYER,
            amount: event.expAwarded,
            description: rewardDescription,
          },
          manager,
        );
      }
      if (event.pointAwarded > 0 && rewardUserIds.length > 0) {
        await this.userBalanceService.addPointsToMany(
          {
            userIds: rewardUserIds,
            type: UserPointLogTypeEnum.INCOME,
            amount: event.pointAwarded,
            description: rewardDescription,
          },
          manager,
        );
      }

      // Events never award DM EXP to the creator. An attended non-guest
      // creator already receives ordinary player rewards above.

      event.status = EventStatusEnum.COMPLETED;
      event.statusBefore = null;
      await manager.getRepository(EventEntity).save(event);
    });
  }
}
