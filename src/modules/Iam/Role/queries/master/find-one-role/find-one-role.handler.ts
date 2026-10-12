import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { RoleRepository } from '../../../repositories/role.repository';
import { FindOneRoleQuery } from './find-one-role.query';
import { FindOneRoleOutput } from './find-one-role.output';

@QueryHandler(FindOneRoleQuery)
export class FindOneRoleHandler implements IQueryHandler<
  FindOneRoleQuery,
  FindOneRoleOutput
> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(query: FindOneRoleQuery): Promise<FindOneRoleOutput> {
    const { id } = query;

    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    const permissionKeys = new Set(
      Array.isArray(query.user.permissions) ? query.user.permissions : [],
    );
    const actionList = {
      isCanUpdate: permissionKeys.has(PermissionEnum.ROLES_UPDATE),
      isCanDelete: permissionKeys.has(PermissionEnum.ROLES_DELETE),
    };
    return new FindOneRoleOutput(role, actionList);
  }
}
