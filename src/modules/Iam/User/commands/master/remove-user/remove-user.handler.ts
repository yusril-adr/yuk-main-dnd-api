import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserRepository } from '../../../repositories/user.repository';
import { RemoveUserCommand } from './remove-user.command';

@CommandHandler(RemoveUserCommand)
export class RemoveUserHandler implements ICommandHandler<RemoveUserCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: RemoveUserCommand): Promise<void> {
    const { id } = command;

    const userEntity = await this.userRepository.findOne({ where: { id } });
    if (!userEntity) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).softDelete(id);
    });
  }
}
