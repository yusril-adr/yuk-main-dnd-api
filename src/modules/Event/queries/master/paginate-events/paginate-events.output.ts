import type { TEvent } from '@entities/main/event/event.entity';
import { EventEntityDto } from '@shared/dtos/entities/event/event.entity.dto';

export type TEventMasterActionList = {
  isCanUpdate: boolean;
  isCanPublish: boolean;
  isCanCancel: boolean;
  isCanArchive: boolean;
  isCanUnarchive: boolean;
  isCanDelete: boolean;
  isCanViewPublic: boolean;
};

export class PaginateEventsItemOutput extends EventEntityDto {
  statusBefore: number | null;
  actionList: TEventMasterActionList;

  constructor(
    payload: TEvent,
    actionList: TEventMasterActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
    this.actionList = actionList;
  }
}

export class PaginateEventsOutput {
  public readonly data: PaginateEventsItemOutput[];
  public readonly count: number;

  constructor(
    events: TEvent[],
    bannerUrls: (string | null)[],
    avatarCreatorUrls: (string | null)[],
    actionLists: TEventMasterActionList[],
    count: number,
  ) {
    this.data = events.map(
      (event, i) =>
        new PaginateEventsItemOutput(
          event,
          actionLists[i],
          bannerUrls[i],
          avatarCreatorUrls[i],
        ),
    );
    this.count = count;
  }
}
