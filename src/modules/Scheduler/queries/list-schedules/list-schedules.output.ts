import type { TEvent } from '@entities/main/event/event.entity';
import type { TStory } from '@entities/main/story/story.entity';
import { ScheduleItemTypeEnum } from '../../enums/schedule-item-type.enum';

export class ListSchedulesItemOutput {
  id: string;
  type: ScheduleItemTypeEnum;
  storyType: number | null;
  title: string;
  start: string;
  end: null;
  allDay: boolean;
  status: number;
  locationType: number;
  bannerUrl: string | null;
  slug: string;

  constructor(
    type: ScheduleItemTypeEnum,
    item: TStory | TEvent,
    bannerUrl: string | null,
  ) {
    this.id = item.id;
    this.type = type;
    this.storyType =
      type === ScheduleItemTypeEnum.STORY ? (item as TStory).type : null;
    this.title = item.title;
    this.start = item.startAt!.toISOString();
    this.end = null;
    this.allDay = false;
    this.status = item.status;
    this.locationType = item.locationType;
    this.bannerUrl = bannerUrl;
    this.slug = item.slug;
  }
}

export class ListSchedulesOutput {
  public readonly data: ListSchedulesItemOutput[];
  public readonly total: number;

  constructor(items: ListSchedulesItemOutput[]) {
    this.data = items;
    this.total = items.length;
  }
}
