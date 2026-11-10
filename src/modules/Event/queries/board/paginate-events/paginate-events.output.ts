import { TEvent } from '@entities/main/event/event.entity';
import type {
  TEventCreatorDto,
  TEventEntityDto,
} from '@shared/dtos/entities/event/event.entity.dto';

type TPaginateEventsItemOutput = Omit<
  TEventEntityDto,
  'expAwarded' | 'pointAwarded' | 'locationDetail' | 'updatedAt'
> & {
  joinedMembers: number;
  memberStatus: number;
};

export class PaginateEventsItemOutput implements TPaginateEventsItemOutput {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: number;
  locationLink: string | null;
  feedbackFormLink: string | null;
  maxMembers?: number | null;
  joinedMembers: number;
  memberStatus: number;
  startAt: string | null;
  locationType: number;
  bannerUrl: string | null;
  createdBy?: TEventCreatorDto;
  createdAt: string;

  constructor(
    payload: TEvent,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
    joinedMembers: number,
    memberStatus: number,
  ) {
    this.id = payload.id;
    this.title = payload.title;
    this.slug = payload.slug;
    this.description = payload.description;
    this.status = payload.status;
    this.locationLink = payload.locationLink ?? null;
    this.feedbackFormLink = payload.feedbackFormLink ?? null;
    this.maxMembers = payload.maxMembers;
    this.joinedMembers = joinedMembers;
    this.memberStatus = memberStatus;
    this.startAt = payload.startAt ? payload.startAt.toISOString() : null;
    this.locationType = payload.locationType;
    this.bannerUrl = bannerUrl ?? null;
    if (payload.createdBy) {
      this.createdBy = {
        id: payload.createdBy.id,
        displayName: payload.createdBy.displayName,
        avatarUrl: avatarCreatorUrl,
      };
    }
    this.createdAt = payload.createdAt.toISOString();
  }
}

export class PaginateEventsOutput {
  public readonly data: PaginateEventsItemOutput[];
  public readonly count: number;

  constructor(
    events: TEvent[],
    bannerUrls: (string | null)[],
    avatarCreatorUrls: (string | null)[],
    currentMemberCounts: number[],
    memberStatuses: number[],
    count: number,
  ) {
    this.data = events.map(
      (event, i) =>
        new PaginateEventsItemOutput(
          event,
          bannerUrls[i],
          avatarCreatorUrls[i],
          currentMemberCounts[i],
          memberStatuses[i],
        ),
    );
    this.count = count;
  }
}
