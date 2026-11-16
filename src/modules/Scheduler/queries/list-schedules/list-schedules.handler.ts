import { BadRequestException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FindOptionsWhere,
  In,
  LessThan,
  MoreThanOrEqual,
  And,
  Not,
  IsNull,
} from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { Story } from '@entities/main/story/story.entity';
import { EventRepository } from '@modules/Event/repositories/event.repository';
import { EventService } from '@modules/Event/services/event.service';
import { PUBLIC_EVENT_STATUSES } from '@modules/Event/enums/event-status.enum';
import { StoryRepository } from '@modules/Story/repositories/story.repository';
import { StoryService } from '@modules/Story/services/story.service';
import { PUBLIC_STORY_STATUSES } from '@modules/Story/enums/story-status.enum';
import { MAX_SCHEDULE_ITEMS } from '../../constants/schedule.constant';
import { ScheduleItemTypeEnum } from '../../enums/schedule-item-type.enum';
import { ListSchedulesQuery } from './list-schedules.query';
import {
  ListSchedulesItemOutput,
  ListSchedulesOutput,
} from './list-schedules.output';

@QueryHandler(ListSchedulesQuery)
export class ListSchedulesHandler implements IQueryHandler<
  ListSchedulesQuery,
  ListSchedulesOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly eventRepository: EventRepository,
    private readonly storyService: StoryService,
    private readonly eventService: EventService,
  ) {}

  async execute(query: ListSchedulesQuery): Promise<ListSchedulesOutput> {
    const { params } = query;
    const start = new Date(params.start);
    const end = new Date(params.end);
    const types = params.type ?? SCHEDULE_TYPES;
    const includeStories = types.includes(ScheduleItemTypeEnum.STORY);
    const includeEvents = types.includes(ScheduleItemTypeEnum.EVENT);

    const storyWhere = this.rangeWhere(
      start,
      end,
      params.status !== undefined ? [params.status] : PUBLIC_STORY_STATUSES,
    );
    const eventWhere = this.rangeWhere(
      start,
      end,
      params.status !== undefined ? [params.status] : PUBLIC_EVENT_STATUSES,
    );

    const storyCount = includeStories
      ? await this.storyRepository.count({ where: storyWhere })
      : 0;
    const eventCount = includeEvents
      ? await this.eventRepository.count({ where: eventWhere })
      : 0;
    if (storyCount + eventCount > MAX_SCHEDULE_ITEMS) {
      throw new BadRequestException(
        `The range matches more than ${MAX_SCHEDULE_ITEMS} items. Please request a smaller date range`,
      );
    }

    const stories = includeStories
      ? await this.storyRepository.find({
          where: storyWhere,
          relations: { bannerFile: true },
        })
      : [];
    const events = includeEvents
      ? await this.eventRepository.find({
          where: eventWhere,
          relations: { bannerFile: true },
        })
      : [];

    const items = [
      ...stories.map(
        (story) =>
          new ListSchedulesItemOutput(
            ScheduleItemTypeEnum.STORY,
            story,
            this.storyService.resolveBannerUrl(story),
          ),
      ),
      ...events.map(
        (event) =>
          new ListSchedulesItemOutput(
            ScheduleItemTypeEnum.EVENT,
            event,
            this.eventService.resolveBannerUrl(event),
          ),
      ),
    ].sort((a, b) => {
      const startDiff = a.start.localeCompare(b.start);
      return startDiff !== 0 ? startDiff : a.id.localeCompare(b.id);
    });

    return new ListSchedulesOutput(items);
  }

  private rangeWhere(
    start: Date,
    end: Date,
    statuses: number[],
  ): FindOptionsWhere<Story> & FindOptionsWhere<Event> {
    return {
      startAt: And(Not(IsNull()), MoreThanOrEqual(start), LessThan(end)),
      status: In(statuses),
    };
  }
}

const SCHEDULE_TYPES = [ScheduleItemTypeEnum.STORY, ScheduleItemTypeEnum.EVENT];
