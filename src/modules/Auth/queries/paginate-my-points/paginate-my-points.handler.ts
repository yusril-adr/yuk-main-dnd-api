import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { PaginateMyPointsQuery } from './paginate-my-points.query';
import { PaginateMyPointsOutput } from './paginate-my-points.output';
import { PaginateMyPointsInput } from './paginate-my-points.input';

@QueryHandler(PaginateMyPointsQuery)
export class PaginateMyPointsHandler implements IQueryHandler<
  PaginateMyPointsQuery,
  PaginateMyPointsOutput
> {
  constructor(
    @InjectRepository(UserPointLog)
    private readonly userPointLogRepository: Repository<UserPointLog>,
  ) {}

  async execute(query: PaginateMyPointsQuery): Promise<PaginateMyPointsOutput> {
    const { userId, params } = query;

    let findOptions: FindManyOptions<UserPointLog> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);
    findOptions.where = mergeEachWhereConditions(findOptions.where, {
      user: { id: userId },
    });

    const [logs, count] = await this.userPointLogRepository.findAndCount({
      ...findOptions,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    return new PaginateMyPointsOutput(logs, count);
  }

  private searchQuery(
    query: FindManyOptions<UserPointLog>,
    params: PaginateMyPointsInput,
  ): FindManyOptions<UserPointLog> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<UserPointLog>[] = [
        { description: ILike(`%${params.search}%`) },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<UserPointLog>,
    params: PaginateMyPointsInput,
  ): FindManyOptions<UserPointLog> {
    if (params.type !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        type: params.type,
      });
    }
    return query;
  }
}
