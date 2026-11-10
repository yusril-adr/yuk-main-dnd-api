import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Not, Repository } from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { EventService } from '../../../services/event.service';
import { PaginateEventsQuery } from './paginate-events.query';
import { PaginateEventsOutput } from './paginate-events.output';
import { PaginateEventsInput } from './paginate-events.input';

@QueryHandler(PaginateEventsQuery)
export class PaginateEventsHandler implements IQueryHandler<
  PaginateEventsQuery,
  PaginateEventsOutput
> {
  constructor(
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
    private readonly eventService: EventService,
  ) {}

  async execute(query: PaginateEventsQuery): Promise<PaginateEventsOutput> {
    const { params, user } = query;

    const [memberships, count] = await this.eventMemberRepository.findAndCount({
      where: {
        user: { id: user.id },
        ...(params.memberStatus !== undefined
          ? { status: params.memberStatus }
          : {}),
        event: this.eventWhere(params),
      },
      relations: {
        event: { createdBy: { avatarFile: true }, bannerFile: true },
      },
      order: {
        event: {
          createdAt: OrderKeyEnum.DESC,
          id: OrderKeyEnum.ASC,
        },
      },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const events = memberships.map((membership) => membership.event);
    const memberStatuses = memberships.map((membership) => membership.status);
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
      memberStatuses,
      count,
    );
  }

  private eventWhere(params: PaginateEventsInput): FindOptionsWhere<Event> {
    const where: FindOptionsWhere<Event> = {
      id: Not(IsNull()),
    };
    if (params.search) {
      where.title = ILike(`%${params.search}%`);
    }
    if (params.status !== undefined) {
      where.status = params.status;
    }
    if (params.locationType !== undefined) {
      where.locationType = params.locationType;
    }
    if (params.createdBy !== undefined) {
      where.createdBy = { id: params.createdBy };
    }
    return where;
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
}
