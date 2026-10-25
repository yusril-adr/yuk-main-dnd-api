import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { Story } from '@entities/main/story/story.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { STORY_PLAYER_EXP_REWARD } from '../../../constants/story-reward.constant';
import { StoryService } from '../../../services/story.service';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { CreateStoryCommand } from './create-story.command';

@CommandHandler(CreateStoryCommand)
export class CreateStoryHandler implements ICommandHandler<CreateStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyService: StoryService,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: CreateStoryCommand): Promise<void> {
    const { params, user } = command;
    if (!this.storyMasterActionService.isCanCreate(user)) {
      throw new ForbiddenException('Story cannot be created');
    }

    const slug = await this.storyService.generateUniqueSlug(params.title);
    const { startAt, bannerFileId, ...storyPayload } = params;

    const temporaryBannerFile = await this.storyService.resolveBannerFile(
      bannerFileId,
      FileStatusEnum.TEMPORARY,
    );
    const storyId = temporaryBannerFile
      ? this.storyService.generateStoryId()
      : undefined;
    const promotionDestination =
      temporaryBannerFile && storyId
        ? this.storyService.getBannerPromotionDestination(
            temporaryBannerFile,
            storyId,
          )
        : undefined;
    const movedBannerFile =
      temporaryBannerFile && promotionDestination
        ? await this.storyService.moveBannerFile(
            temporaryBannerFile,
            promotionDestination,
          )
        : null;

    try {
      await this.dataSource.transaction(async (manager) => {
        const storyRepo = manager.getRepository(Story);
        const fileRepo = manager.getRepository(File);
        const bannerFile = movedBannerFile
          ? await fileRepo.save(movedBannerFile)
          : null;

        await storyRepo.save(
          storyRepo.create({
            ...storyPayload,
            ...(storyId ? { id: storyId } : {}),
            ...(startAt !== undefined && { startAt: new Date(startAt) }),
            slug,
            // Always the fixed reward; the input only accepts this value.
            expAwarded: STORY_PLAYER_EXP_REWARD,
            createdBy: { id: user.id },
            bannerFile,
          }),
        );
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
  }
}
