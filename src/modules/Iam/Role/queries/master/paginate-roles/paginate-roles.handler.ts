import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere, ILike } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Role } from '@entities/main/iam/role.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { RoleRepository } from '../../../repositories/role.repository';
import { PaginateRolesQuery } from './paginate-roles.query';
import { PaginateRolesOutput } from './paginate-roles.output';
import { PaginateRolesInput } from './paginate-roles.input';

@QueryHandler(PaginateRolesQuery)
export class PaginateRolesHandler implements IQueryHandler<
  PaginateRolesQuery,
  PaginateRolesOutput
> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(query: PaginateRolesQuery): Promise<PaginateRolesOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<Role> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);

    const [roles, count] = await Promise.all([
      this.roleRepository.find({
        ...findOptions,
        take: params.perPage,
        skip: params.perPage * (params.page - 1),
      }),
      this.roleRepository.count(findOptions),
    ]);

    return PaginateRolesOutput.from(roles, count);
  }

  private searchQuery(
    query: FindManyOptions<Role>,
    params: PaginateRolesInput,
  ): FindManyOptions<Role> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<Role>[] = [
        {
          key: ILike(`%${params.search}%`),
        },
        {
          name: ILike(`%${params.search}%`),
        },
        {
          description: ILike(`%${params.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<Role>,
    params: PaginateRolesInput,
  ): FindManyOptions<Role> {
    if (params.isShowInPublic !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        isShowInPublic: params.isShowInPublic,
      });
    }
    return query;
  }
}
