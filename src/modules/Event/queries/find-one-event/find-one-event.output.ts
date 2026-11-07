import type { TEvent } from '@entities/main/event/event.entity';
import { EventEntityDto } from '@shared/dtos/entities/event/event.entity.dto';
export class FindOneEventOutput extends EventEntityDto {
  constructor(
    payload: TEvent,
    bannerUrl: string | null,
    avatarCreatorUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, bannerUrl, avatarCreatorUrl);
  }
}
