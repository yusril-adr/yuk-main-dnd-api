import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMember } from '@entities/main/event/event-member.entity';
import { EventStatusEnum } from '../../enums/event-status.enum';
import { EventService } from '../../services/event.service';
import { FindOneEventQuery } from './find-one-event.query';
import {
  FindOneEventOutput,
  TEventDetailActionList,
} from './find-one-event.output';

@QueryHandler(FindOneEventQuery)
export class FindOneEventHandler implements IQueryHandler<
  FindOneEventQuery,
  FindOneEventOutput
> {
  constructor(
    private readonly eventService: EventService,
    @InjectRepository(EventMember)
    private readonly eventMemberRepository: Repository<EventMember>,
  ) {}

  async execute(query: FindOneEventQuery): Promise<FindOneEventOutput> {
    const { identifier, user } = query;

    const event = await this.eventService.findPublicByIdentifier(identifier, {
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
    });

    let actionList: TEventDetailActionList = {
      isCanJoin: false,
      isCanCancelJoin: false,
    };
    if (user !== null && event.status === EventStatusEnum.PUBLISHED) {
      const member = await this.eventMemberRepository.findOne({
        where: { event: { id: event.id }, user: { id: user.id } },
      });
      actionList = {
        isCanJoin: !member,
        isCanCancelJoin: Boolean(member),
      };
    }

    return new FindOneEventOutput(
      event,
      actionList,
      this.eventService.resolveBannerUrl(event),
      this.eventService.resolveAvatarCreatorUrl(event),
    );
  }
}
