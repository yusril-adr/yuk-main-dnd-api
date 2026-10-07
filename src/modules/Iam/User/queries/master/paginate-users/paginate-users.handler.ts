import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/iam/user.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { StorageService } from '@modules/Global/services/storage.service';
import { UserRepository } from '../../../repositories/user.repository';
import { PaginateUsersQuery } from './paginate-users.query';
import { PaginateUsersOutput } from './paginate-users.output';
import { PaginateUsersInput } from './paginate-users.input';

@QueryHandler(PaginateUsersQuery)
export class PaginateUsersHandler
  implements IQueryHandler<PaginateUsersQuery, PaginateUsersOutput>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: PaginateUsersQuery): Promise<PaginateUsersOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<User> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = await this.filterQuery(findOptions, params);

    const users = await this.userRepository.find({
      ...findOptions,
      relations: { userRoles: { role: true }, avatarFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const avatarUrls = users.map((user) =>
      user.avatarFile
        ? this.storageService.getPublicUrlSync(user.avatarFile)
        : undefined,
    );

    const count = await this.userRepository.count(findOptions);

    return PaginateUsersOutput.from(users, avatarUrls, count);
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
        {
          email: ILike(`%${params.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private async filterQuery(
    query: FindManyOptions<User>,
    params: PaginateUsersInput,
  ): Promise<FindManyOptions<User>> {
    if (params.roleIds?.length) {
      const userRoles = await this.userRepository.manager
        .getRepository(UserRole)
        .createQueryBuilder('ur')
        .select('DISTINCT ur.user_id', 'user_id')
        .where('ur.role_id IN (:...roleIds)', { roleIds: params.roleIds })
        .getRawMany();

      const userIds = userRoles.map((ur) => ur.user_id);

      query.where = mergeEachWhereConditions(query.where, {
        id: In(userIds.length ? userIds : ['']),
      });
    }
    return query;
  }
}