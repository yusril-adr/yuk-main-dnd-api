import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { UserService } from '@modules/Iam/User/services/user.service';
import { EventService } from '../../services/event.service';
import { PUBLIC_EVENT_STATUSES } from '../../enums/event-status.enum';
import { PaginateUserJoinedEventsQuery } from './paginate-user-joined-events.query';
import { PaginateUserJoinedEventsOutput } from './paginate-user-joined-events.output';
import { PaginateUserJoinedEventsInput } from './paginate-user-joined-events.input';

@QueryHandler(PaginateUserJoinedEventsQuery)
export class PaginateUserJoinedEventsHandler implements IQueryHandler<
  PaginateUserJoinedEventsQuery,
  PaginateUserJoinedEventsOutput
> {
  constructor(
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
    private readonly eventService: EventService,
    private readonly userService: UserService,
  ) {}

  async execute(
    query: PaginateUserJoinedEventsQuery,
  ): Promise<PaginateUserJoinedEventsOutput> {
    const { identifier, params } = query;
    const user = await this.userService.findPublicByIdentifier(identifier);

    const [memberships, count] = await this.eventMemberRepository.findAndCount({
      where: {
        user: { id: user.id },
        event: this.eventWhere(params),
      },
      relations: {
        event: { createdBy: { avatarFile: true }, bannerFile: true },
      },
      order: {
        event: {
          [camelCase(params.sortBy)]: params.order,
        },
      } as FindOptionsOrder<EventMember>,
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

    return new PaginateUserJoinedEventsOutput(
      events,
      bannerUrls,
      avatarCreatorUrls,
      currentMemberCounts,
      memberStatuses,
      count,
    );
  }

  private eventWhere(
    params: PaginateUserJoinedEventsInput,
  ): FindOptionsWhere<Event> {
    const where: FindOptionsWhere<Event> = {
      deletedAt: IsNull(),
    };
    if (params.search) {
      where.title = ILike(`%${params.search}%`);
    }
    if (params.status !== undefined) {
      where.status = params.status;
    } else {
      where.status = In(PUBLIC_EVENT_STATUSES);
    }
    if (params.locationType !== undefined) {
      where.locationType = params.locationType;
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
      .getRawMany<{
        event_id?: string;
        eventId?: string;
        member_count?: string | number;
        memberCount?: string | number;
      }>();

    const counts = new Map<string, number>();
    for (const row of rows) {
      const eventId = row.event_id ?? row.eventId;
      const memberCount = row.member_count ?? row.memberCount;
      if (eventId != null) {
        counts.set(eventId, Number(memberCount));
      }
    }
    return counts;
  }
}
