import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Role } from '@entities/main/iam/role.entity';
import { RoleService } from '../../services/role.service';
import { CreateRoleCommand } from './create-role.command';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly roleService: RoleService,
  ) {}

  async execute(command: CreateRoleCommand): Promise<void> {
    const { params } = command;
    const key = await this.roleService.generateUniqueKey(params.name);
    const { permissionIds, ...rolePayload } = params;

    await this.dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role);
      const role = await roleRepository.save(
        roleRepository.create({ ...rolePayload, key }),
      );

      if (permissionIds?.length) {
        await this.roleService.assignPermissions(manager, role, permissionIds);
      }
    });
  }
}