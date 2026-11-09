import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { EventRepository } from '../../../repositories/event.repository';
import { EventService } from '../../../services/event.service';
import { EventMasterActionService } from '../../../services/event-master-action.service';
import { UpdateEventCommand } from './update-event.command';

@CommandHandler(UpdateEventCommand)
export class UpdateEventHandler implements ICommandHandler<UpdateEventCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventRepository: EventRepository,
    private readonly eventService: EventService,
    private readonly eventMasterActionService: EventMasterActionService,
  ) {}

  async execute(command: UpdateEventCommand): Promise<void> {
    const { id, params, user } = command;

    const eventEntity = await this.eventRepository.findOne({
      where: { id },
      relations: { bannerFile: true, createdBy: true },
    });
    if (!eventEntity) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    if (!this.eventMasterActionService.isCanUpdate(eventEntity, user)) {
      throw new ForbiddenException('Event cannot be updated');
    }

    const { startAt, bannerFileId, ...eventPayload } = params;

    if (params.title && eventEntity.title !== params.title) {
      eventEntity.slug = await this.eventService.generateUniqueSlug(
        params.title,
      );
    }
    const isBannerFileProvided = bannerFileId !== undefined;
    const previousBannerFile = eventEntity.bannerFile;
    const isCurrentBannerFile = bannerFileId === previousBannerFile?.id;
    const temporaryBannerFile =
      isBannerFileProvided && bannerFileId !== null && !isCurrentBannerFile
        ? await this.eventService.resolveBannerFile(
            bannerFileId,
            FileStatusEnum.TEMPORARY,
            id,
          )
        : null;
    const promotionDestination = temporaryBannerFile
      ? this.eventService.getBannerPromotionDestination(temporaryBannerFile, id)
      : undefined;
    const movedBannerFile =
      temporaryBannerFile && promotionDestination
        ? await this.eventService.moveBannerFile(
            temporaryBannerFile,
            promotionDestination,
          )
        : null;
    const nextBannerFile = movedBannerFile
      ? movedBannerFile
      : isBannerFileProvided
        ? isCurrentBannerFile
          ? previousBannerFile
          : null
        : previousBannerFile;

    try {
      await this.dataSource.transaction(async (manager) => {
        const eventRepo = manager.getRepository(Event);
        const fileRepo = manager.getRepository(File);
        const bannerFile = movedBannerFile
          ? await fileRepo.save(movedBannerFile)
          : nextBannerFile;

        Object.assign(eventEntity, eventPayload);
        if (startAt !== undefined) {
          eventEntity.startAt = startAt === null ? null : new Date(startAt);
        }
        if (isBannerFileProvided) {
          eventEntity.bannerFile = bannerFile;
        }

        await eventRepo.save(eventEntity);
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

    if (
      isBannerFileProvided &&
      previousBannerFile &&
      previousBannerFile.id !== nextBannerFile?.id
    ) {
      await this.eventService.cleanupBannerFile(previousBannerFile);
    }
  }
}
