import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EventService } from '../../services/event.service';
import { FindOneEventQuery } from './find-one-event.query';
import { FindOneEventOutput } from './find-one-event.output';
@QueryHandler(FindOneEventQuery)
export class FindOneEventHandler implements IQueryHandler<
  FindOneEventQuery,
  FindOneEventOutput
> {
  constructor(private readonly eventService: EventService) {}
  async execute(query: FindOneEventQuery): Promise<FindOneEventOutput> {
    const event = await this.eventService.findPublicByIdentifier(
      query.identifier,
      {
        relations: { createdBy: { avatarFile: true }, bannerFile: true },
      },
    );
    return new FindOneEventOutput(
      event,
      this.eventService.resolveBannerUrl(event),
      this.eventService.resolveAvatarCreatorUrl(event),
    );
  }
}
