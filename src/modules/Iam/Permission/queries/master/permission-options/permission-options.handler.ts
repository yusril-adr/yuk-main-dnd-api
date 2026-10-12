import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Permission } from '@entities/main/iam/permission.entity';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { PermissionRepository } from '../../../repositories/permission.repository';
import { PermissionOptionsQuery } from './permission-options.query';
import { PermissionOptionsOutput } from './permission-options.output';
import { PermissionOptionsInput } from './permission-options.input';

type PermissionWhere = FindOptionsWhere<Permission>;

@QueryHandler(PermissionOptionsQuery)
export class PermissionOptionsHandler implements IQueryHandler<
  PermissionOptionsQuery,
  PermissionOptionsOutput
> {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async execute(
    query: PermissionOptionsQuery,
  ): Promise<PermissionOptionsOutput> {
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

    return new PermissionOptionsOutput(permissions);
  }

  private filterQuery(
    query: FindManyOptions<Permission>,
    params: PermissionOptionsInput,
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
