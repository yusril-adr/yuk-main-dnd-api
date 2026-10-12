import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, ILike } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Role } from '@entities/main/iam/role.entity';
import { mergeWhereConditions } from '@shared/utils/common';
import { RoleRepository } from '../../../repositories/role.repository';
import { PaginateRoleOptionsQuery } from './paginate-role-options.query';
import { PaginateRoleOptionsOutput } from './paginate-role-options.output';
import { PaginateRoleOptionsInput } from './paginate-role-options.input';

@QueryHandler(PaginateRoleOptionsQuery)
export class PaginateRoleOptionsHandler implements IQueryHandler<
  PaginateRoleOptionsQuery,
  PaginateRoleOptionsOutput
> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(
    query: PaginateRoleOptionsQuery,
  ): Promise<PaginateRoleOptionsOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<Role> = {
      select: {
        id: true,
        name: true,
      },
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);

    const [roles, count] = await Promise.all([
      this.roleRepository.find({
        ...findOptions,
        take: params.perPage,
        skip: params.perPage * (params.page - 1),
      }),
      this.roleRepository.count({
        where: findOptions.where,
      }),
    ]);

    return new PaginateRoleOptionsOutput(roles, count);
  }

  private searchQuery(
    query: FindManyOptions<Role>,
    params: PaginateRoleOptionsInput,
  ): FindManyOptions<Role> {
    if (params.search) {
      query.where = mergeWhereConditions(query.where, {
        name: ILike(`%${params.search}%`),
      });
    }
    return query;
  }
}
