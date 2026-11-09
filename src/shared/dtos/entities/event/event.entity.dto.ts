import type { TEvent } from '@entities/main/event/event.entity';
import dayjs from '@shared/utils/dayjs';

export type TEventCreatorDto = {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
};

export type TEventEntityDto = Omit<
  TEvent,
  | 'createdBy'
  | 'bannerFile'
  | 'startAt'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'eventMembers'
  | 'statusBefore'
> & {
  createdBy?: TEventCreatorDto;
  bannerUrl: string | null;
  startAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class EventEntityDto implements TEventEntityDto {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: number;
  locationLink: string | null;
  feedbackFormLink: string | null;
  expAwarded: number;
  pointAwarded: number;
  maxMembers?: number | null;
  startAt: string | null;
  locationType: number;
  locationDetail: string;
  bannerUrl: string | null;
  createdBy?: TEventCreatorDto;
  createdAt: string;
  updatedAt: string;

  parseEntity(
    event: TEvent,
    bannerUrl?: string | null,
    avatarCreatorUrl?: string | null,
  ): EventEntityDto {
    this.id = event.id;
    this.title = event.title;
    this.slug = event.slug;
    this.description = event.description;
    this.status = event.status;
    this.locationLink = event.locationLink ?? null;
    this.feedbackFormLink = event.feedbackFormLink ?? null;
    this.expAwarded = event.expAwarded;
    this.pointAwarded = event.pointAwarded;
    this.maxMembers = event.maxMembers;
    this.startAt = event.startAt ? dayjs(event.startAt).toISOString() : null;
    this.locationType = event.locationType;
    this.locationDetail = event.locationDetail;
    this.bannerUrl = bannerUrl ?? null;
    if (event.createdBy) {
      this.createdBy = {
        id: event.createdBy.id,
        displayName: event.createdBy.displayName,
        username: event.createdBy.username ?? null,
        avatarUrl: avatarCreatorUrl,
      };
    }
    this.createdAt = dayjs(event.createdAt).toISOString();
    this.updatedAt = dayjs(event.updatedAt).toISOString();

    return this;
  }
}
