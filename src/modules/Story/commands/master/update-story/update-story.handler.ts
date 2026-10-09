import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { Story } from '@entities/main/story/story.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryService } from '../../../services/story.service';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { UpdateStoryCommand } from './update-story.command';

@CommandHandler(UpdateStoryCommand)
export class UpdateStoryHandler implements ICommandHandler<UpdateStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
    private readonly storyPermissionService: StoryPermissionService,
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

    this.storyPermissionService.assertCanModify(
      storyEntity,
      user,
      PermissionEnum.STORIES_UPDATE,
    );

    const { startAt, bannerFileId, ...storyPayload } = params;
    if ('status' in storyPayload) {
      delete storyPayload.status;
    }

    if (storyPayload.title && storyEntity.title !== storyPayload.title) {
      storyEntity.slug = await this.storyService.generateUniqueSlug(
        storyPayload.title,
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

        Object.assign(storyEntity, storyPayload);
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
