import type { TEvent } from '@entities/main/event/event.entity';
import { EventEntityDto } from '@shared/dtos/entities/event/event.entity.dto';

export type TEventMasterDetailActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isCanViewPublic: boolean;
  isCanAddMembers: boolean;
  isCanRemoveMembers: boolean;
  isCanCreateGuestUser: boolean;
};

export class FindOneEventOutput extends EventEntityDto {
  statusBefore: number | null;
  actionList: TEventMasterDetailActionList;

  constructor(
    payload: TEvent,
    actionList: TEventMasterDetailActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
    this.actionList = actionList;
  }
}
