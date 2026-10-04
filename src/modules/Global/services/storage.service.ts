import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileDriverEnum } from '@modules/Global/enum/file-driver.enum';
import { File as FileEntity } from '@entities/main/file.entity';
import { SupabaseStorageIntegration } from '@shared/libs/supabase/supabase-storage.integration';
import type { TUploadedFile } from '@shared/types/uploaded-file.type';
import type {
  TStorageMoveOptions,
  TStorageUploadOptions,
} from '../types/storage-options.type';

@Injectable()
export class StorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseStorageIntegration: SupabaseStorageIntegration,
  ) {}

  async upload(
    file: TUploadedFile,
    options: TStorageUploadOptions,
  ): Promise<{
    bucket: string;
    path: string;
    driver: FileDriverEnum;
  }> {
    const driver = this.getConfiguredDriver();

    switch (driver) {
      case FileDriverEnum.SUPABASE:
        await this.supabaseStorageIntegration.upload(
          options.bucket,
          options.path,
          file,
          options.upsert,
        );
        return {
          bucket: options.bucket,
          path: options.path,
          driver: FileDriverEnum.SUPABASE,
        };
      case FileDriverEnum.LOCAL:
      // TODO: upload to local
      default:
        throw this.unsupportedDriverError(driver);
    }
  }

  async createSignedUrl(file: FileEntity): Promise<{
    url: string;
    expiresAt: Date;
  }> {
    switch (file.driver) {
      case FileDriverEnum.SUPABASE:
        return this.supabaseStorageIntegration.createSignedUrl(
          file.bucket,
          file.path,
        );
      case FileDriverEnum.LOCAL:
      default:
        throw this.unsupportedDriverError(file.driver);
    }
  }

  async delete(file: FileEntity): Promise<void> {
    switch (file.driver) {
      case FileDriverEnum.SUPABASE:
        await this.supabaseStorageIntegration.delete(file.bucket, file.path);
        return;
      case FileDriverEnum.LOCAL:
      default:
        throw this.unsupportedDriverError(file.driver);
    }
  }

  async move(
    file: FileEntity,
    destination: TStorageMoveOptions,
  ): Promise<{
    bucket: string;
    path: string;
    driver: FileDriverEnum;
  }> {
    switch (file.driver) {
      case FileDriverEnum.SUPABASE:
        if (file.bucket !== destination.bucket) {
          throw new InternalServerErrorException(
            'Storage move across buckets is not supported',
          );
        }

        await this.supabaseStorageIntegration.move(
          file.bucket,
          file.path,
          destination.path,
        );
        return {
          bucket: destination.bucket,
          path: destination.path,
          driver: FileDriverEnum.SUPABASE,
        };
      case FileDriverEnum.LOCAL:
      default:
        throw this.unsupportedDriverError(file.driver);
    }
  }

  getPublicUrlSync(file: FileEntity): string {
    switch (file.driver) {
      case FileDriverEnum.SUPABASE:
        return this.supabaseStorageIntegration.getPublicUrlSync(
          file.bucket,
          file.path,
        );
      case FileDriverEnum.LOCAL:
      default:
        throw this.unsupportedDriverError(file.driver);
    }
  }

  private getConfiguredDriver(): string {
    return (
      this.configService.get<string>('STORAGE_DRIVER') ??
      FileDriverEnum.SUPABASE
    );
  }

  private unsupportedDriverError(driver: string): InternalServerErrorException {
    return new InternalServerErrorException(
      `Storage driver '${driver}' is not supported`,
    );
  }
}
