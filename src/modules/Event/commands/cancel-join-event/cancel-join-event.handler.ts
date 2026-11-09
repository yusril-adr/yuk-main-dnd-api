import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import {
  PUBLIC_EVENT_STATUSES,
  EventStatusEnum,
} from '../../enums/event-status.enum';
import { CancelJoinEventCommand } from './cancel-join-event.command';

@CommandHandler(CancelJoinEventCommand)
export class CancelJoinEventHandler implements ICommandHandler<CancelJoinEventCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CancelJoinEventCommand): Promise<void> {
    const { id, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);

    await this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(Event);
      const eventMemberRepo = manager.getRepository(EventMember);
      const event = await eventRepo.findOne({ where: { id } });

      if (!event || !PUBLIC_EVENT_STATUSES.includes(event.status)) {
        throw new NotFoundException(`Event with id ${id} not found`);
      }

      if (event.status !== EventStatusEnum.PUBLISHED) {
        throw new BadRequestException('Only published events can cancel join');
      }

      const existing = await eventMemberRepo.findOne({
        where: { event: { id }, user: { id: user.id } },
      });

      if (!existing) {
        throw new NotFoundException(
          `User with id ${user.id} is not a member of this event`,
        );
      }

      await eventMemberRepo.softRemove(existing);
    });
  }
}
