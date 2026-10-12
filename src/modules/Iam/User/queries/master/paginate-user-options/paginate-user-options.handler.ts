import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere, ILike } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/iam/user.entity';
import { mergeWhereConditions } from '@shared/utils/common';
import { UserRepository } from '../../../repositories/user.repository';
import { PaginateUserOptionsQuery } from './paginate-user-options.query';
import { PaginateUserOptionsOutput } from './paginate-user-options.output';
import { PaginateUserOptionsInput } from './paginate-user-options.input';

@QueryHandler(PaginateUserOptionsQuery)
export class PaginateUserOptionsHandler implements IQueryHandler<
  PaginateUserOptionsQuery,
  PaginateUserOptionsOutput
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    query: PaginateUserOptionsQuery,
  ): Promise<PaginateUserOptionsOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<User> = {
      select: {
        id: true,
        displayName: true,
        username: true,
      },
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);

    const [users, count] = await Promise.all([
      this.userRepository.find({
        ...findOptions,
        take: params.perPage,
        skip: params.perPage * (params.page - 1),
      }),
      this.userRepository.count({
        where: findOptions.where,
      }),
    ]);

    return new PaginateUserOptionsOutput(users, count);
  }

  private searchQuery(
    query: FindManyOptions<User>,
    params: PaginateUserOptionsInput,
  ): FindManyOptions<User> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<User>[] = [
        {
          displayName: ILike(`%${params.search}%`),
        },
        {
          username: ILike(`%${params.search}%`),
        },
        {
          email: ILike(`%${params.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }
}
