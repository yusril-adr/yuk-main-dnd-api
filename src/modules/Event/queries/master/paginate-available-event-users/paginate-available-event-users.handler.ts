import { NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/iam/user.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StorageService } from '@modules/Global/services/storage.service';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { EventRepository } from '../../../repositories/event.repository';
import { PaginateAvailableEventUsersQuery } from './paginate-available-event-users.query';
import { PaginateAvailableEventUsersOutput } from './paginate-available-event-users.output';
import { PaginateAvailableEventUsersInput } from './paginate-available-event-users.input';

@QueryHandler(PaginateAvailableEventUsersQuery)
export class PaginateAvailableEventUsersHandler implements IQueryHandler<
  PaginateAvailableEventUsersQuery,
  PaginateAvailableEventUsersOutput
> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly userRepository: UserRepository,
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginateAvailableEventUsersQuery,
  ): Promise<PaginateAvailableEventUsersOutput> {
    const { id, params } = query;

    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const members = await this.eventMemberRepository.find({
      where: { event: { id }, deletedAt: IsNull() },
      relations: { user: true },
    });
    const excludedUserIds = members
      .map((member) => member.user?.id)
      .filter((userId): userId is string => Boolean(userId));

    let findOptions: FindManyOptions<User> = {};
    findOptions = this.sortQuery(findOptions, params);
    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, excludedUserIds);

    const users = await this.userRepository.find({
      ...findOptions,
      relations: { avatarFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const avatarUrls = users.map((user) =>
      user.avatarFile
        ? this.storageService.getPublicUrlSync(user.avatarFile)
        : undefined,
    );

    const count = await this.userRepository.count(findOptions);

    return new PaginateAvailableEventUsersOutput(users, avatarUrls, count);
  }

  private sortQuery(
    query: FindManyOptions<User>,
    params: PaginateAvailableEventUsersInput,
  ): FindManyOptions<User> {
    query.order = {
      [camelCase(params.sortBy)]: params.order,
    };
    return query;
  }

  private searchQuery(
    query: FindManyOptions<User>,
    params: PaginateAvailableEventUsersInput,
  ): FindManyOptions<User> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<User>[] = [
        { username: ILike(`%${params.search}%`) },
        { displayName: ILike(`%${params.search}%`) },
        { email: ILike(`%${params.search}%`) },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<User>,
    excludedUserIds: string[],
  ): FindManyOptions<User> {
    if (excludedUserIds.length > 0) {
      query.where = mergeEachWhereConditions(query.where, {
        id: Not(In(excludedUserIds)),
      });
    }
    return query;
  }
}
