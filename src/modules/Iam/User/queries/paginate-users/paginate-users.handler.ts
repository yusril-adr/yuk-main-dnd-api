import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere, ILike } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { UserRepository } from '../../repositories/user.repository';
import { UserService, visiblePublicUser } from '../../services/user.service';
import { PaginateUsersQuery } from './paginate-users.query';
import { PaginateUsersOutput } from './paginate-users.output';
import { PaginateUsersInput } from './paginate-users.input';

@QueryHandler(PaginateUsersQuery)
export class PaginateUsersHandler implements IQueryHandler<
  PaginateUsersQuery,
  PaginateUsersOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  async execute(query: PaginateUsersQuery): Promise<PaginateUsersOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<User> = {
      order: {
        dmExp: OrderKeyEnum.DESC,
        playerExp: OrderKeyEnum.DESC,
        id: OrderKeyEnum.ASC,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions);

    const [users, count] = await this.userRepository.findAndCount({
      ...findOptions,
      relations: { avatarFile: true, userRoles: { role: true } },
      relationLoadStrategy: 'query',
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const avatarUrls = await Promise.all(
      users.map((user) => this.userService.resolveAvatarUrl(user)),
    );

    return new PaginateUsersOutput(
      users,
      avatarUrls.map((avatarUrl) => avatarUrl ?? null),
      count,
    );
  }

  private searchQuery(
    query: FindManyOptions<User>,
    params: PaginateUsersInput,
  ): FindManyOptions<User> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<User>[] = [
        {
          username: ILike(`%${params.search}%`),
        },
        {
          displayName: ILike(`%${params.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(query: FindManyOptions<User>): FindManyOptions<User> {
    query.where = mergeEachWhereConditions(query.where, {
      id: visiblePublicUser(),
    });
    return query;
  }
}
