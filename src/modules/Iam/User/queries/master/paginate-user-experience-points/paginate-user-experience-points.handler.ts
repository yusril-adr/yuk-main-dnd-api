import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { UserRepository } from '../../../repositories/user.repository';
import { PaginateUserExperiencePointsQuery } from './paginate-user-experience-points.query';
import { PaginateUserExperiencePointsOutput } from './paginate-user-experience-points.output';
import { PaginateUserExperiencePointsInput } from './paginate-user-experience-points.input';

@QueryHandler(PaginateUserExperiencePointsQuery)
export class PaginateUserExperiencePointsHandler implements IQueryHandler<
  PaginateUserExperiencePointsQuery,
  PaginateUserExperiencePointsOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(UserExpLog)
    private readonly userExpLogRepository: Repository<UserExpLog>,
  ) {}

  async execute(
    query: PaginateUserExperiencePointsQuery,
  ): Promise<PaginateUserExperiencePointsOutput> {
    const { id, params } = query;

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    let findOptions: FindManyOptions<UserExpLog> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);
    findOptions.where = mergeEachWhereConditions(findOptions.where, {
      user: { id },
    });

    const [logs, count] = await this.userExpLogRepository.findAndCount({
      ...findOptions,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    return new PaginateUserExperiencePointsOutput(logs, count);
  }

  private searchQuery(
    query: FindManyOptions<UserExpLog>,
    params: PaginateUserExperiencePointsInput,
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
    params: PaginateUserExperiencePointsInput,
  ): FindManyOptions<UserExpLog> {
    if (params.type !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        type: params.type,
      });
    }
    return query;
  }
}
