import type { TEvent } from '@entities/main/event/event.entity';
import { EventEntityDto } from '@shared/dtos/entities/event/event.entity.dto';

export type TEventBoardDetailActionList = {
  isCanViewPublic: boolean;
};

export class FindOneEventOutput extends EventEntityDto {
  statusBefore: number | null;
  actionList: TEventBoardDetailActionList;

  constructor(
    payload: TEvent,
    actionList: TEventBoardDetailActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.statusBefore = payload.statusBefore ?? null;
    this.actionList = actionList;
  }
}
