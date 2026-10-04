import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere, ILike } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Permission } from '@entities/main/iam/permission.entity';
import { mergeWhereConditions } from '@shared/utils/common';
import { PermissionRepository } from '../../repositories/permission.repository';
import { PaginatePermissionsQuery } from './paginate-permissions.query';
import { PaginatePermissionsOutput } from './paginate-permissions.output';
import { PaginatePermissionsInput } from './paginate-permissions.input';

type PermissionWhere = FindOptionsWhere<Permission>;

@QueryHandler(PaginatePermissionsQuery)
export class PaginatePermissionsHandler
  implements IQueryHandler<PaginatePermissionsQuery, PaginatePermissionsOutput>
{
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async execute(
    query: PaginatePermissionsQuery,
  ): Promise<PaginatePermissionsOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<Permission> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.filterQuery(findOptions, params);
    findOptions = this.searchQuery(findOptions, params);

    const [permissions, count] = await Promise.all([
      this.permissionRepository.find({
        ...findOptions,
        take: params.perPage,
        skip: params.perPage * (params.page - 1),
      }),
      this.permissionRepository.count(findOptions),
    ]);

    return PaginatePermissionsOutput.from(permissions, count);
  }

  private filterQuery(
    query: FindManyOptions<Permission>,
    params: PaginatePermissionsInput,
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

  private searchQuery(
    query: FindManyOptions<Permission>,
    params: PaginatePermissionsInput,
  ): FindManyOptions<Permission> {
    if (params.search) {
      const searchPattern = `%${params.search}%`;
      const searchCondition: FindOptionsWhere<Permission>[] = [
        {
          key: ILike(searchPattern),
        },
      ];

      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }
}