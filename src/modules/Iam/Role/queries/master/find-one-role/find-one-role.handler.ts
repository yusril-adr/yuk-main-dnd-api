import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
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

    return FindOneRoleOutput.from(role);
  }
}
