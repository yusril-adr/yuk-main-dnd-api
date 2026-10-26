import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { Story } from '@entities/main/story/story.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryService } from '../../../services/story.service';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { UpdateStoryCommand } from './update-story.command';

@CommandHandler(UpdateStoryCommand)
export class UpdateStoryHandler implements ICommandHandler<UpdateStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: UpdateStoryCommand): Promise<void> {
    const { id, params, user } = command;

    const storyEntity = await this.storyRepository.findOne({
      where: { id },
      relations: { bannerFile: true, createdBy: true },
    });
    if (!storyEntity) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanUpdate(storyEntity, user)) {
      throw new ForbiddenException('Story cannot be updated');
    }

    const { startAt, bannerFileId } = params;

    if (params.title && storyEntity.title !== params.title) {
      storyEntity.slug = await this.storyService.generateUniqueSlug(
        params.title,
      );
    }
    const isBannerFileProvided = bannerFileId !== undefined;
    const previousBannerFile = storyEntity.bannerFile;
    const isCurrentBannerFile = bannerFileId === previousBannerFile?.id;
    const temporaryBannerFile =
      isBannerFileProvided && bannerFileId !== null && !isCurrentBannerFile
        ? await this.storyService.resolveBannerFile(
            bannerFileId,
            FileStatusEnum.TEMPORARY,
            id,
          )
        : null;
    const promotionDestination = temporaryBannerFile
      ? this.storyService.getBannerPromotionDestination(temporaryBannerFile, id)
      : undefined;
    const movedBannerFile =
      temporaryBannerFile && promotionDestination
        ? await this.storyService.moveBannerFile(
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
        const storyRepo = manager.getRepository(Story);
        const fileRepo = manager.getRepository(File);
        const bannerFile = movedBannerFile
          ? await fileRepo.save(movedBannerFile)
          : nextBannerFile;

        if (params.title !== undefined) {
          storyEntity.title = params.title;
        }
        if (params.description !== undefined) {
          storyEntity.description = params.description;
        }
        if (params.type !== undefined) {
          storyEntity.type = params.type;
        }
        if (params.gameSystem !== undefined) {
          storyEntity.gameSystem = params.gameSystem;
        }
        if (params.discordChannelLink !== undefined) {
          storyEntity.discordChannelLink = params.discordChannelLink;
        }
        if (params.expAwarded !== undefined) {
          storyEntity.expAwarded = params.expAwarded;
        }
        if (params.pointAwarded !== undefined) {
          storyEntity.pointAwarded = params.pointAwarded;
        }
        if (params.maxMembers !== undefined) {
          storyEntity.maxMembers = params.maxMembers;
        }
        if (params.locationType !== undefined) {
          storyEntity.locationType = params.locationType;
        }
        if (params.locationDetail !== undefined) {
          storyEntity.locationDetail = params.locationDetail;
        }
        if (params.locationLink !== undefined) {
          storyEntity.locationLink = params.locationLink;
        }
        if (params.feedbackFormLink !== undefined) {
          storyEntity.feedbackFormLink = params.feedbackFormLink;
        }
        if (startAt !== undefined) {
          storyEntity.startAt = startAt === null ? null : new Date(startAt);
        }
        if (isBannerFileProvided) {
          storyEntity.bannerFile = bannerFile;
        }

        await storyRepo.save(storyEntity);
      });
    } catch (error) {
      if (movedBannerFile && temporaryBannerFile) {
        await this.storyService.restoreTemporaryBannerFile(
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
      await this.storyService.cleanupBannerFile(previousBannerFile);
    }
  }
}
