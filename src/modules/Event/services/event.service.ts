import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { randomBytes, randomUUID } from 'crypto';
import { FindOneOptions, In, Repository } from 'typeorm';
import { File } from '@entities/main/file.entity';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { StorageService } from '@modules/Global/services/storage.service';
import { EventBannerPathService } from '@modules/Global/services/event-banner-path.service';
import { EventRepository } from '../repositories/event.repository';
import {
  PUBLIC_EVENT_STATUSES,
  EventStatusEnum,
} from '../enums/event-status.enum';

const EVENT_SLUG_MAX_LENGTH = 180;
const EVENT_SLUG_SUFFIX_LENGTH = 6;
const EVENT_SLUG_GENERATION_MAX_ATTEMPTS = 10;
const EVENT_SLUG_FALLBACK_PREFIX = 'event';
const EVENT_SLUG_SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
    private readonly eventBannerPathService: EventBannerPathService,
  ) {}

  generateEventId(): string {
    return randomUUID();
  }

  isCancelledEvent(event: {
    status: number;
    statusBefore?: number | null;
  }): boolean {
    return (
      event.status === EventStatusEnum.CANCELLED ||
      (event.status === EventStatusEnum.ARCHIVED &&
        event.statusBefore === EventStatusEnum.CANCELLED)
    );
  }

  isCanViewPublic(event: { status: number }): boolean {
    return PUBLIC_EVENT_STATUSES.includes(event.status);
  }

  async findPublicByIdentifier(
    identifier: string,
    options?: Pick<FindOneOptions<Event>, 'relations'>,
  ): Promise<Event> {
    const publicStatus = In(PUBLIC_EVENT_STATUSES);

    if (isUUID(identifier)) {
      const eventById = await this.eventRepository.findOne({
        where: { id: identifier, status: publicStatus },
        relations: options?.relations,
      });
      if (eventById) {
        return eventById;
      }
    }

    const eventBySlug = await this.eventRepository.findOne({
      where: { slug: identifier.toLowerCase(), status: publicStatus },
      relations: options?.relations,
    });
    if (!eventBySlug) {
      throw new NotFoundException(
        `Event with identifier ${identifier} not found`,
      );
    }

    return eventBySlug;
  }

  async resolveBannerFile(
    bannerFileId: string | null | undefined,
    expectedStatus: FileStatusEnum,
    eventId?: string,
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

    const fileEvent = await this.eventRepository.findOne({
      where: { bannerFile: { id: bannerFileId } },
      withDeleted: true,
    });
    if (fileEvent && fileEvent.id !== eventId) {
      throw new ConflictException(
        `File with id ${bannerFileId} is already assigned to another event`,
      );
    }

    return file;
  }

  getBannerPromotionDestination(
    file: File,
    eventId: string,
  ): { bucket: string; path: string } {
    const bucket = this.eventBannerPathService.getBucket();
    if (
      file.bucket !== bucket ||
      !this.eventBannerPathService.isTemporaryPath(file.path)
    ) {
      throw new ConflictException(
        `File with id ${file.id} is not a temporary event banner`,
      );
    }

    return {
      bucket,
      path: this.eventBannerPathService.createPromotedPath(eventId, file.path),
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

  resolveBannerUrl(event: Event): string | null {
    return event.bannerFile
      ? this.storageService.getPublicUrlSync(event.bannerFile)
      : null;
  }

  resolveAvatarCreatorUrl(event: Event): string | null {
    return event.createdBy.avatarFile
      ? this.storageService.getPublicUrlSync(event.createdBy.avatarFile)
      : null;
  }

  async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);

    if (!baseSlug) {
      return this.generateSlugWithSuffix(EVENT_SLUG_FALLBACK_PREFIX);
    }

    const existingBaseSlug = await this.eventRepository.findOne({
      where: { slug: baseSlug },
      withDeleted: true,
    });

    if (!existingBaseSlug) {
      return baseSlug;
    }

    return this.generateSlugWithSuffix(baseSlug);
  }

  private async generateSlugWithSuffix(baseSlug: string): Promise<string> {
    const maxBaseLength = EVENT_SLUG_MAX_LENGTH - EVENT_SLUG_SUFFIX_LENGTH - 1;

    for (
      let attempt = 0;
      attempt < EVENT_SLUG_GENERATION_MAX_ATTEMPTS;
      attempt++
    ) {
      const suffix = this.generateRandomSuffix();
      const candidateSlug = `${baseSlug.slice(0, maxBaseLength)}-${suffix}`;
      const existingSlug = await this.eventRepository.findOne({
        where: { slug: candidateSlug },
        withDeleted: true,
      });

      if (!existingSlug) {
        return candidateSlug;
      }
    }

    throw new ConflictException('Unable to generate a unique event slug');
  }

  private slugify(title: string): string {
    return title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, EVENT_SLUG_MAX_LENGTH)
      .replace(/-+$/, '');
  }

  private generateRandomSuffix(): string {
    const bytes = randomBytes(EVENT_SLUG_SUFFIX_LENGTH);
    return Array.from(bytes, (byte) =>
      EVENT_SLUG_SUFFIX_ALPHABET.charAt(
        byte % EVENT_SLUG_SUFFIX_ALPHABET.length,
      ),
    ).join('');
  }
}
