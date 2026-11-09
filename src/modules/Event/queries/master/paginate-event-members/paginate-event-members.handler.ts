import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  IsNull,
  Repository,
} from 'typeorm';
import { camelCase, snakeCase } from 'typeorm/util/StringUtils';
import { EventMember } from '@entities/main/event/event-member.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import {
  getAllEntityProperties,
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { PaginateEventMembersQuery } from './paginate-event-members.query';
import { PaginateEventMembersOutput } from './paginate-event-members.output';
import { PaginateEventMembersInput } from './paginate-event-members.input';

@QueryHandler(PaginateEventMembersQuery)
export class PaginateEventMembersHandler implements IQueryHandler<
  PaginateEventMembersQuery,
  PaginateEventMembersOutput
> {
  constructor(
    private readonly eventRepository: EventRepository,
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginateEventMembersQuery,
  ): Promise<PaginateEventMembersOutput> {
    const { id, params } = query;

    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    // withDeleted keeps a soft-deleted user on the row.
    // find() without it left-joins user and omits that user.
    let findOptions: FindManyOptions<EventMember> = {
      relations: { user: { avatarFile: true } },
      withDeleted: true,
    };
    findOptions = this.sortQuery(findOptions, params);
    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);
    findOptions.where = mergeEachWhereConditions(findOptions.where, {
      event: { id },
      deletedAt: IsNull(),
    });

    const [members, count] = await this.eventMemberRepository.findAndCount({
      ...findOptions,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const visibleMembers: EventMember[] = [];
    const avatarUrls: (string | null)[] = [];
    for (const member of members) {
      if (member.deletedAt != null || !member.user) {
        continue;
      }
      visibleMembers.push(member);
      avatarUrls.push(
        member.user.avatarFile
          ? this.storageService.getPublicUrlSync(member.user.avatarFile)
          : null,
      );
    }

    return new PaginateEventMembersOutput(visibleMembers, avatarUrls, count);
  }

  private sortQuery(
    query: FindManyOptions<EventMember>,
    params: PaginateEventMembersInput,
  ): FindManyOptions<EventMember> {
    const sortable = new Set(
      getAllEntityProperties(EventMember)
        .map((prop) => snakeCase(prop))
        .filter(
          (column) =>
            column !== 'event' && column !== 'user' && column !== 'status',
        ),
    );
    const sortBy = sortable.has(params.sortBy) ? params.sortBy : 'updated_at';
    const direction = params.order ?? OrderKeyEnum.ASC;

    query.order = {
      status: OrderKeyEnum.DESC,
      [camelCase(sortBy)]: direction,
    };
    return query;
  }

  private searchQuery(
    query: FindManyOptions<EventMember>,
    params: PaginateEventMembersInput,
  ): FindManyOptions<EventMember> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<EventMember>[] = [
        { user: { username: ILike(`%${params.search}%`) } },
        { user: { displayName: ILike(`%${params.search}%`) } },
        { user: { email: ILike(`%${params.search}%`) } },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<EventMember>,
    params: PaginateEventMembersInput,
  ): FindManyOptions<EventMember> {
    if (params.status !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        status: params.status,
      });
    }
    return query;
  }
}
