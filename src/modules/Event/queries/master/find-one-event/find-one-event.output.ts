import type { TEvent } from '@entities/main/event/event.entity';
import { EventEntityDto } from '@shared/dtos/entities/event/event.entity.dto';

import type { TEventMasterActionList } from '../paginate-events/paginate-events.output';

export class FindOneEventOutput extends EventEntityDto {
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
