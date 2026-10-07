import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { Story } from '@entities/main/story/story.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { StorageService } from '@modules/Global/services/storage.service';
import { StoryBannerPathService } from '@modules/Global/services/story-banner-path.service';
import { StoryRepository } from '../repositories/story.repository';

const STORY_SLUG_MAX_LENGTH = 180;
const STORY_SLUG_SUFFIX_LENGTH = 6;
const STORY_SLUG_GENERATION_MAX_ATTEMPTS = 10;
const STORY_SLUG_SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

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
    const baseSlug = this.slugify(title);
    const existingBaseSlug = await this.storyRepository.findOne({
      where: { slug: baseSlug },
      withDeleted: true,
    });

    if (!existingBaseSlug) {
      return baseSlug;
    }

    const maxBaseLength = STORY_SLUG_MAX_LENGTH - STORY_SLUG_SUFFIX_LENGTH - 1;

    for (
      let attempt = 0;
      attempt < STORY_SLUG_GENERATION_MAX_ATTEMPTS;
      attempt++
    ) {
      const suffix = this.generateRandomSuffix();
      const candidateSlug = `${baseSlug.slice(0, maxBaseLength)}-${suffix}`;
      const existingSlug = await this.storyRepository.findOne({
        where: { slug: candidateSlug },
        withDeleted: true,
      });

      if (!existingSlug) {
        return candidateSlug;
      }
    }

    throw new ConflictException('Unable to generate a unique story slug');
  }

  private slugify(title: string): string {
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, STORY_SLUG_MAX_LENGTH);

    if (!slug) {
      throw new BadRequestException(
        'Story title must contain at least one letter or number',
      );
    }

    return slug;
  }

  private generateRandomSuffix(): string {
    const bytes = randomBytes(STORY_SLUG_SUFFIX_LENGTH);
    return Array.from(bytes, (byte) =>
      STORY_SLUG_SUFFIX_ALPHABET.charAt(
        byte % STORY_SLUG_SUFFIX_ALPHABET.length,
      ),
    ).join('');
  }
}
