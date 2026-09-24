import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { UserRepository } from '@modules/Master/Iam/User/user.repository';
import { FilePurposesEnum } from '@modules/File/enums/file-purposes.enum';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { TJWTPayload } from '@shared/types/jwt-payload.type';
import type { TFileUploadMetadata } from '../types/file-upload-metadata.type';
import { TFilePurposeUploadConfig } from '../types/file-purpose-upload-config.type';

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FilePurposeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  async resolveUploadConfig(
    purpose: FilePurposesEnum,
    metadata: TFileUploadMetadata,
    currentUser: TJWTPayload,
    originalName: string,
  ): Promise<TFilePurposeUploadConfig> {
    switch (purpose) {
      case FilePurposesEnum.USER_AVATAR:
        return this.resolveUserAvatarConfig(metadata, currentUser, originalName);
      case FilePurposesEnum.OTHER:
        return this.resolveOtherConfig(originalName);
      default:
        throw new BadRequestException(
          `File purpose '${purpose}' is not supported`,
        );
    }
  }

  private async resolveUserAvatarConfig(
    metadata: TFileUploadMetadata,
    currentUser: TJWTPayload,
    originalName: string,
  ): Promise<TFilePurposeUploadConfig> {
    const targetId = metadata.targetId ?? currentUser.id;
    const isTargetingAnotherUser = targetId !== currentUser.id;

    if (!isUUID(targetId)) {
      throw new BadRequestException('metadata.target_id must be a valid UUID');
    }

    if (
      isTargetingAnotherUser &&
      !currentUser.permissions.includes(PermissionEnum.USERS_UPDATE)
    ) {
      throw new ForbiddenException(
        'Users update permission is required to upload for another user',
      );
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: targetId },
    });
    if (!targetUser) {
      throw new NotFoundException(`Target user with id ${targetId} not found`);
    }

    const bucket = this.getRequiredConfig('FILE_USER_AVATAR_BUCKET');
    const pathPrefix = this.configService.get<string>(
      'FILE_USER_AVATAR_PATH_PREFIX',
      'users',
    );

    const extension = extname(originalName).toLowerCase();

    return {
      bucket,
      path: `${pathPrefix}/${targetId}/${randomUUID()}${extension}`,
      upsert: false,
      maxFileSizeBytes: this.getMaxFileSizeBytes(
        'FILE_USER_AVATAR_MAX_FILE_SIZE_BYTES',
      ),
    };
  }

  private resolveOtherConfig(
    originalName: string,
  ): TFilePurposeUploadConfig {
    const bucket = this.getRequiredConfig('FILE_OTHER_BUCKET');
    const pathPrefix = this.configService.get<string>(
      'FILE_OTHER_PATH_PREFIX',
      'others',
    );
    const extension = extname(originalName).toLowerCase();

    return {
      bucket,
      path: `${pathPrefix}/${randomUUID()}${extension}`,
      upsert: false,
      maxFileSizeBytes: this.getMaxFileSizeBytes(
        'FILE_OTHER_MAX_FILE_SIZE_BYTES',
      ),
    };
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }
    return value;
  }

  private getMaxFileSizeBytes(key: string): number {
    const value = Number(
      this.configService.get<string>(
        key,
        String(DEFAULT_MAX_FILE_SIZE_BYTES),
      ),
    );

    if (!Number.isInteger(value) || value <= 0) {
      throw new InternalServerErrorException(
        `${key} must be a positive integer`,
      );
    }

    return value;
  }
}
