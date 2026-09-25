import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { FilePurposesEnum } from '@modules/File/enums/file-purposes.enum';
import { FileStatusEnum } from '@modules/shared/enum/file-status.enum';
import { UserAvatarPathService } from '@modules/shared/services/user-avatar-path.service';
import { TFilePurposeUploadConfig } from '../types/file-purpose-upload-config.type';

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class FilePurposeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userAvatarPathService: UserAvatarPathService,
  ) {}

  resolveUploadConfig(
    purpose: FilePurposesEnum,
    originalName: string,
  ): TFilePurposeUploadConfig {
    switch (purpose) {
      case FilePurposesEnum.USER_AVATAR:
        return this.resolveUserAvatarConfig(originalName);
      case FilePurposesEnum.OTHER:
        return this.resolveOtherConfig(originalName);
      default:
        throw new BadRequestException(
          `File purpose '${purpose}' is not supported`,
        );
    }
  }

  private resolveUserAvatarConfig(
    originalName: string,
  ): TFilePurposeUploadConfig {
    return {
      bucket: this.userAvatarPathService.getBucket(),
      path: this.userAvatarPathService.createTemporaryPath(originalName),
      upsert: false,
      maxFileSizeBytes: this.getMaxFileSizeBytes(
        'FILE_USER_AVATAR_MAX_FILE_SIZE_BYTES',
      ),
      status: FileStatusEnum.TEMPORARY,
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
      status: FileStatusEnum.ACTIVE,
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
