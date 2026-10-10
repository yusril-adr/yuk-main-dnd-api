import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { UserRepository } from '../../../repositories/user.repository';
import { PaginateUserPointsQuery } from './paginate-user-points.query';
import { PaginateUserPointsOutput } from './paginate-user-points.output';
import { PaginateUserPointsInput } from './paginate-user-points.input';

@QueryHandler(PaginateUserPointsQuery)
export class PaginateUserPointsHandler implements IQueryHandler<
  PaginateUserPointsQuery,
  PaginateUserPointsOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(UserPointLog)
    private readonly userPointLogRepository: Repository<UserPointLog>,
  ) {}

  async execute(
    query: PaginateUserPointsQuery,
  ): Promise<PaginateUserPointsOutput> {
    const { id, params } = query;

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    let findOptions: FindManyOptions<UserPointLog> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);
    findOptions.where = mergeEachWhereConditions(findOptions.where, {
      user: { id },
    });

    const [logs, count] = await this.userPointLogRepository.findAndCount({
      ...findOptions,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    return new PaginateUserPointsOutput(logs, count);
  }

  private searchQuery(
    query: FindManyOptions<UserPointLog>,
    params: PaginateUserPointsInput,
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
    params: PaginateUserPointsInput,
  ): FindManyOptions<UserPointLog> {
    if (params.type !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        type: params.type,
      });
    }
    return query;
  }
}
