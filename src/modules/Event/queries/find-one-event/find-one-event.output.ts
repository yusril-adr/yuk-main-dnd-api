import type { TEvent } from '@entities/main/event/event.entity';
import { EventEntityDto } from '@shared/dtos/entities/event/event.entity.dto';

export type TEventDetailActionList = {
  isCanJoin: boolean;
  isCanCancelJoin: boolean;
};

export class FindOneEventOutput extends EventEntityDto {
  actionList: TEventDetailActionList;

  constructor(
    payload: TEvent,
    actionList: TEventDetailActionList,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
    this.actionList = actionList;
  }
}
