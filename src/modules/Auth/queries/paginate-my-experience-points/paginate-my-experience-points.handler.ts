import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { PaginateMyExperiencePointsQuery } from './paginate-my-experience-points.query';
import { PaginateMyExperiencePointsOutput } from './paginate-my-experience-points.output';
import { PaginateMyExperiencePointsInput } from './paginate-my-experience-points.input';

@QueryHandler(PaginateMyExperiencePointsQuery)
export class PaginateMyExperiencePointsHandler implements IQueryHandler<
  PaginateMyExperiencePointsQuery,
  PaginateMyExperiencePointsOutput
> {
  constructor(
    @InjectRepository(UserExpLog)
    private readonly userExpLogRepository: Repository<UserExpLog>,
  ) {}

  async execute(
    query: PaginateMyExperiencePointsQuery,
  ): Promise<PaginateMyExperiencePointsOutput> {
    const { userId, params } = query;

    let findOptions: FindManyOptions<UserExpLog> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);
    findOptions.where = mergeEachWhereConditions(findOptions.where, {
      user: { id: userId },
    });

    const [logs, count] = await this.userExpLogRepository.findAndCount({
      ...findOptions,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    return new PaginateMyExperiencePointsOutput(logs, count);
  }

  private searchQuery(
    query: FindManyOptions<UserExpLog>,
    params: PaginateMyExperiencePointsInput,
  ): FindManyOptions<UserExpLog> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<UserExpLog>[] = [
        { description: ILike(`%${params.search}%`) },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<UserExpLog>,
    params: PaginateMyExperiencePointsInput,
  ): FindManyOptions<UserExpLog> {
    if (params.type !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        type: params.type,
      });
    }
    if (params.direction !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        direction: params.direction,
      });
    }
    return query;
  }
}
