import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Permission } from '@entities/main/iam/permission.entity';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { PermissionRepository } from '../../../repositories/permission.repository';
import { FindAllPermissionsQuery } from './find-all-permissions.query';
import { FindAllPermissionsOutput } from './find-all-permissions.output';
import { FindAllPermissionsInput } from './find-all-permissions.input';

type PermissionWhere = FindOptionsWhere<Permission>;

@QueryHandler(FindAllPermissionsQuery)
export class FindAllPermissionsHandler implements IQueryHandler<
  FindAllPermissionsQuery,
  FindAllPermissionsOutput
> {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async execute(
    query: FindAllPermissionsQuery,
  ): Promise<FindAllPermissionsOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<Permission> = {
      order: {
        module: OrderKeyEnum.ASC,
        action: OrderKeyEnum.ASC,
        key: OrderKeyEnum.ASC,
      },
    };

    findOptions = this.filterQuery(findOptions, params);

    const permissions = await this.permissionRepository.find(findOptions);

    return FindAllPermissionsOutput.from(permissions);
  }

  private filterQuery(
    query: FindManyOptions<Permission>,
    params: FindAllPermissionsInput,
  ): FindManyOptions<Permission> {
    const filterCondition: PermissionWhere = {};

    if (params.module) {
      filterCondition.module = params.module;
    }

    if (params.action) {
      filterCondition.action = params.action;
    }

    if (Object.keys(filterCondition).length) {
      query.where = filterCondition;
    }

    return query;
  }
}
