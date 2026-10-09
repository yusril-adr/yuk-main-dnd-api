import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '@entities/main/iam/role.entity';
import { RoleRepository } from '../../../repositories/role.repository';
import { RemoveRoleCommand } from './remove-role.command';

@CommandHandler(RemoveRoleCommand)
export class RemoveRoleHandler implements ICommandHandler<RemoveRoleCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: RemoveRoleCommand): Promise<void> {
    const { id } = command;

    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Role).softDelete(id);
    });
  }
}
