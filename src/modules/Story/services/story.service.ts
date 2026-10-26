import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { FindOneOptions, In, Repository } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { Story } from '@entities/main/story/story.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { StorageService } from '@modules/Global/services/storage.service';
import { StoryBannerPathService } from '@modules/Global/services/story-banner-path.service';
import { generateUniqueSlug } from '@shared/utils/slug';
import { StoryRepository } from '../repositories/story.repository';
import {
  PUBLIC_STORY_STATUSES,
  StoryStatusEnum,
} from '../enums/story-status.enum';

const STORY_SLUG_MAX_LENGTH = 180;
const STORY_SLUG_FALLBACK_PREFIX = 'story';

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    private readonly storyRepository: StoryRepository,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
    private readonly storyBannerPathService: StoryBannerPathService,
  ) {}

  generateStoryId(): string {
    return randomUUID();
  }

  isCancelledStory(story: {
    status: number;
    statusBefore?: number | null;
  }): boolean {
    return (
      story.status === StoryStatusEnum.CANCELLED ||
      (story.status === StoryStatusEnum.ARCHIVED &&
        story.statusBefore === StoryStatusEnum.CANCELLED)
    );
  }

  isCanViewPublic(story: { status: number }): boolean {
    return PUBLIC_STORY_STATUSES.includes(story.status);
  }

  async findPublicByIdentifier(
    identifier: string,
    options?: Pick<FindOneOptions<Story>, 'relations'>,
  ): Promise<Story> {
    const publicStatus = In(PUBLIC_STORY_STATUSES);

    if (isUUID(identifier)) {
      const storyById = await this.storyRepository.findOne({
        where: { id: identifier, status: publicStatus },
        relations: options?.relations,
      });
      if (storyById) {
        return storyById;
      }
    }

    const storyBySlug = await this.storyRepository.findOne({
      where: { slug: identifier.toLowerCase(), status: publicStatus },
      relations: options?.relations,
    });
    if (!storyBySlug) {
      throw new NotFoundException(
        `Story with identifier ${identifier} not found`,
      );
    }

    return storyBySlug;
  }

  async resolveBannerFile(
    bannerFileId: string | null | undefined,
    expectedStatus: FileStatusEnum,
    storyId?: string,
  ): Promise<File | null> {
    if (bannerFileId === null || bannerFileId === undefined) {
      return null;
    }

    const file = await this.fileRepository.findOne({
      where: { id: bannerFileId },
    });
    if (!file) {
      throw new NotFoundException(`File with id ${bannerFileId} not found`);
    }

    if (file.status !== expectedStatus) {
      throw new ConflictException(
        `File with id ${bannerFileId} must be ${expectedStatus}`,
      );
    }

    const fileStory = await this.storyRepository.findOne({
      where: { bannerFile: { id: bannerFileId } },
      withDeleted: true,
    });
    if (fileStory && fileStory.id !== storyId) {
      throw new ConflictException(
        `File with id ${bannerFileId} is already assigned to another story`,
      );
    }

    return file;
  }

  getBannerPromotionDestination(
    file: File,
    storyId: string,
  ): { bucket: string; path: string } {
    const bucket = this.storyBannerPathService.getBucket();
    if (
      file.bucket !== bucket ||
      !this.storyBannerPathService.isTemporaryPath(file.path)
    ) {
      throw new ConflictException(
        `File with id ${file.id} is not a temporary story banner`,
      );
    }

    return {
      bucket,
      path: this.storyBannerPathService.createPromotedPath(storyId, file.path),
    };
  }

  async moveBannerFile(
    file: File,
    destination: { bucket: string; path: string },
  ): Promise<File> {
    const movedStorageFile = await this.storageService.move(file, destination);

    return this.fileRepository.create({
      ...file,
      bucket: movedStorageFile.bucket,
      path: movedStorageFile.path,
      driver: movedStorageFile.driver,
      status: FileStatusEnum.ACTIVE,
    });
  }

  async restoreTemporaryBannerFile(
    movedFile: File,
    temporaryFile: File,
  ): Promise<void> {
    try {
      await this.storageService.move(movedFile, {
        bucket: temporaryFile.bucket,
        path: temporaryFile.path,
      });
    } catch (error) {
      this.logger.error(
        `Failed to restore temporary banner file ${temporaryFile.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async cleanupBannerFile(file: File): Promise<void> {
    try {
      await this.storageService.delete(file);
      await this.fileRepository.softDelete(file.id);
    } catch (error) {
      this.logger.error(
        `Failed to clean up banner file ${file.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  resolveBannerUrl(story: Story): string | null {
    return story.bannerFile
      ? this.storageService.getPublicUrlSync(story.bannerFile)
      : null;
  }

  resolveAvatarCreatorUrl(story: Story): string | null {
    return story.createdBy.avatarFile
      ? this.storageService.getPublicUrlSync(story.createdBy.avatarFile)
      : null;
  }

  async generateUniqueSlug(title: string): Promise<string> {
    const slug = await generateUniqueSlug(title, {
      maxLength: STORY_SLUG_MAX_LENGTH,
      fallbackPrefix: STORY_SLUG_FALLBACK_PREFIX,
      isTaken: (candidate) =>
        this.storyRepository.exists({
          where: { slug: candidate },
          withDeleted: true,
        }),
    });

    if (!slug) {
      throw new ConflictException('Unable to generate a unique story slug');
    }

    return slug;
  }
}
