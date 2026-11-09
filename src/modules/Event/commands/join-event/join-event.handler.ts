import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { EventMemberStatusEnum } from '../../enums/event-member-status.enum';
import {
  PUBLIC_EVENT_STATUSES,
  EventStatusEnum,
} from '../../enums/event-status.enum';
import { JoinEventCommand } from './join-event.command';

@CommandHandler(JoinEventCommand)
export class JoinEventHandler implements ICommandHandler<JoinEventCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: JoinEventCommand): Promise<void> {
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
        throw new BadRequestException('Only published events can be joined');
      }

      const existing = await eventMemberRepo.findOne({
        where: { event: { id }, user: { id: user.id } },
        withDeleted: true,
      });

      if (existing && existing.deletedAt == null) {
        throw new ConflictException(
          `User with id ${user.id} is already a member of this event`,
        );
      }

      if (existing) {
        existing.status = EventMemberStatusEnum.REGISTERED;
        await eventMemberRepo.recover(existing);
        await eventMemberRepo.save(existing);
        return;
      }

      await eventMemberRepo.save(
        eventMemberRepo.create({
          event: { id },
          user: { id: user.id },
          status: EventMemberStatusEnum.REGISTERED,
        }),
      );
    });
  }
}
