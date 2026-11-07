import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { EventService } from '../../../services/event.service';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { CreateEventCommand } from './create-event.command';

@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventService: EventService,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: CreateEventCommand): Promise<void> {
    const { params, user } = command;
    if (!this.eventMasterActionService.isCanCreate(user)) {
      throw new ForbiddenException('Event cannot be created');
    }

    const slug = await this.eventService.generateUniqueSlug(params.title);
    const { startAt, bannerFileId, ...eventPayload } = params;

    const temporaryBannerFile = await this.eventService.resolveBannerFile(
      bannerFileId,
      FileStatusEnum.TEMPORARY,
    );
    const eventId = temporaryBannerFile
      ? this.eventService.generateEventId()
      : undefined;
    const promotionDestination =
      temporaryBannerFile && eventId
        ? this.eventService.getBannerPromotionDestination(
            temporaryBannerFile,
            eventId,
          )
        : undefined;
    const movedBannerFile =
      temporaryBannerFile && promotionDestination
        ? await this.eventService.moveBannerFile(
            temporaryBannerFile,
            promotionDestination,
          )
        : null;

    try {
      await this.dataSource.transaction(async (manager) => {
        const eventRepo = manager.getRepository(Event);
        const fileRepo = manager.getRepository(File);
        const bannerFile = movedBannerFile
          ? await fileRepo.save(movedBannerFile)
          : null;

        await eventRepo.save(
          eventRepo.create({
            ...eventPayload,
            ...(eventId ? { id: eventId } : {}),
            ...(startAt !== undefined && {
              startAt: startAt === null ? null : new Date(startAt),
            }),
            slug,
            createdBy: { id: user.id },
            bannerFile,
          }),
        );
      });
    } catch (error) {
      if (movedBannerFile && temporaryBannerFile) {
        await this.eventService.restoreTemporaryBannerFile(
          movedBannerFile,
          temporaryBannerFile,
        );
      }

      throw error;
    }
  }
}
