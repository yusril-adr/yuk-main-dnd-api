import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { PUBLIC_EVENT_STATUSES } from '../../enums/event-status.enum';
import { EventRepository } from '../../repositories/event.repository';
import { EventService } from '../../services/event.service';
import { PaginateEventsQuery } from './paginate-events.query';
import { PaginateEventsOutput } from './paginate-events.output';
import { PaginateEventsInput } from './paginate-events.input';

@QueryHandler(PaginateEventsQuery)
export class PaginateEventsHandler implements IQueryHandler<
  PaginateEventsQuery,
  PaginateEventsOutput
> {
  constructor(
    private readonly eventRepository: EventRepository,
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
    private readonly eventService: EventService,
  ) {}

  async execute(query: PaginateEventsQuery): Promise<PaginateEventsOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<Event> = {
      order: {
        createdAt: OrderKeyEnum.DESC,
        id: OrderKeyEnum.ASC,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);

    const [events, count] = await this.eventRepository.findAndCount({
      ...findOptions,
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const bannerUrls = events.map((event) =>
      this.eventService.resolveBannerUrl(event),
    );
    const avatarCreatorUrls = events.map((event) =>
      this.eventService.resolveAvatarCreatorUrl(event),
    );
    const memberCounts = await this.countCurrentMembers(
      events.map((event) => event.id),
    );
    const currentMemberCounts = events.map(
      (event) => memberCounts.get(event.id) ?? 0,
    );

    return new PaginateEventsOutput(
      events,
      bannerUrls,
      avatarCreatorUrls,
      currentMemberCounts,
      count,
    );
  }

  private async countCurrentMembers(
    eventIds: string[],
  ): Promise<Map<string, number>> {
    if (eventIds.length === 0) {
      return new Map();
    }

    const rows = await this.eventMemberRepository
      .createQueryBuilder('member')
      .select('member.event_id', 'event_id')
      .addSelect('COUNT(member.id)', 'member_count')
      .where('member.event_id IN (:...eventIds)', { eventIds })
      .andWhere('member.deleted_at IS NULL')
      .groupBy('member.event_id')
      .getRawMany<{ event_id: string; member_count: string }>();

    return new Map(rows.map((row) => [row.event_id, Number(row.member_count)]));
  }

  private searchQuery(
    query: FindManyOptions<Event>,
    params: PaginateEventsInput,
  ): FindManyOptions<Event> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<Event>[] = [
        {
          title: ILike(`%${params.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<Event>,
    params: PaginateEventsInput,
  ): FindManyOptions<Event> {
    if (params.status !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        status: params.status,
      });
    } else {
      query.where = mergeEachWhereConditions(query.where, {
        status: In(PUBLIC_EVENT_STATUSES),
      });
    }
    if (params.locationType !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        locationType: params.locationType,
      });
    }
    if (params.createdBy !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        createdBy: { id: params.createdBy },
      });
    }
    return query;
  }
}
