import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '@entities/main/iam/role.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';
import { RoleRepository } from '../../../repositories/role.repository';
import { RoleService } from '../../../services/role.service';
import { UpdateRoleCommand } from './update-role.command';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roleRepository: RoleRepository,
    private readonly roleService: RoleService,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<void> {
    const { id, params } = command;

    const roleEntity = await this.roleRepository.findOne({
      where: { id },
    });
    if (!roleEntity) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    const hasNameChanged =
      params.name !== undefined && params.name !== roleEntity.name;
    const { permissionIds, ...rolePayload } = params;
    Object.assign(roleEntity, rolePayload);

    if (hasNameChanged) {
      roleEntity.key = await this.roleService.generateUniqueKey(
        params.name as string,
        id,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role);
      const result = await roleRepository.save(roleEntity);

      if (permissionIds !== undefined) {
        await manager.getRepository(RolePermission).delete({ role: { id } });
        if (permissionIds.length) {
          await this.roleService.assignPermissions(
            manager,
            result,
            permissionIds,
          );
        }
      }
    });
  }
}