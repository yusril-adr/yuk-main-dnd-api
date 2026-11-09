import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere, ILike } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { EventRepository } from '../../../repositories/event.repository';
import { EventService } from '../../../services/event.service';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { PaginateEventsQuery } from './paginate-events.query';
import {
  PaginateEventsOutput,
  TEventMasterActionList,
} from './paginate-events.output';
import { PaginateEventsInput } from './paginate-events.input';

@QueryHandler(PaginateEventsQuery)
export class PaginateEventsHandler implements IQueryHandler<
  PaginateEventsQuery,
  PaginateEventsOutput
> {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventService: EventService,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(query: PaginateEventsQuery): Promise<PaginateEventsOutput> {
    const { params, user } = query;

    let findOptions: FindManyOptions<Event> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
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

    const actionLists: TEventMasterActionList[] = events.map((event) => ({
      isCanUpdate: this.eventMasterActionService.isCanUpdate(event, user),
      isCanPublish: this.eventMasterActionService.isCanPublish(event, user),
      isCanCancel: this.eventMasterActionService.isCanCancel(event, user),
      isCanArchive: this.eventMasterActionService.isCanArchive(event, user),
      isCanUnarchive: this.eventMasterActionService.isCanUnarchive(event, user),
      isCanDelete: this.eventMasterActionService.isCanDelete(event, user),
      isCanViewPublic: this.eventMasterActionService.isCanViewPublic(event),
    }));

    return new PaginateEventsOutput(
      events,
      bannerUrls,
      avatarCreatorUrls,
      actionLists,
      count,
    );
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
