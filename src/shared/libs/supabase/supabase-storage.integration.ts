import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClientIntegration } from './supabase-client.integration';
import type { TUploadedFile } from '@shared/types/uploaded-file.type';
import type { TSupabaseStorageSettings } from './types/supabase-storage-options.type';

@Injectable()
export class SupabaseStorageIntegration {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseClientIntegration: SupabaseClientIntegration,
  ) {}

  async upload(
    bucket: string,
    path: string,
    file: TUploadedFile,
    upsert: boolean,
  ): Promise<void> {
    this.getSettings();
    const client = this.supabaseClientIntegration.getClient();
    this.validateBucket(bucket);

    const { error } = await client.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert,
      });

    if (error) {
      throw new ServiceUnavailableException(
        'File storage is temporarily unavailable. Please try again later.',
        { cause: error },
      );
    }
  }

  async createSignedUrl(
    bucket: string,
    path: string,
  ): Promise<{
    url: string;
    expiresAt: Date;
  }> {
    const settings = this.getSettings();
    const client = this.supabaseClientIntegration.getClient();
    this.validateBucket(bucket);

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, settings.signedUrlExpiresInSeconds);

    if (error) {
      throw new ServiceUnavailableException(
        'File storage is temporarily unavailable. Please try again later.',
        { cause: error },
      );
    }

    if (!data?.signedUrl) {
      throw new ServiceUnavailableException(
        'File storage is temporarily unavailable. Please try again later.',
        { cause: new Error('Supabase did not return a signed URL') },
      );
    }

    return {
      url: data.signedUrl,
      expiresAt: new Date(
        Date.now() + settings.signedUrlExpiresInSeconds * 1000,
      ),
    };
  }

  async delete(bucket: string, path: string): Promise<void> {
    this.validateBucket(bucket);
    this.validatePath(path);

    const client = this.supabaseClientIntegration.getClient();
    const { error } = await client.storage.from(bucket).remove([path]);

    if (error) {
      throw new ServiceUnavailableException(
        'File storage is temporarily unavailable. Please try again later.',
        { cause: error },
      );
    }
  }

  async move(
    bucket: string,
    sourcePath: string,
    destinationPath: string,
  ): Promise<void> {
    this.validateBucket(bucket);
    this.validatePath(sourcePath);
    this.validatePath(destinationPath);

    const client = this.supabaseClientIntegration.getClient();
    const { error } = await client.storage
      .from(bucket)
      .move(sourcePath, destinationPath);

    if (error) {
      throw new ServiceUnavailableException(
        'File storage is temporarily unavailable. Please try again later.',
        { cause: error },
      );
    }
  }

  getPublicUrlSync(bucket: string, path: string): string {
    this.validateBucket(bucket);

    const client = this.supabaseClientIntegration.getClient();
    const { data } = client.storage.from(bucket).getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new InternalServerErrorException(
        'Storage public URL could not be generated',
      );
    }

    return data.publicUrl;
  }

  private getSettings(): TSupabaseStorageSettings {
    const signedUrlExpiresInSeconds = Number(
      this.configService.get<string>('SUPABASE_SIGNED_URL_EXPIRES_IN', '900'),
    );

    if (
      !Number.isInteger(signedUrlExpiresInSeconds) ||
      signedUrlExpiresInSeconds <= 0
    ) {
      throw new InternalServerErrorException(
        'SUPABASE_SIGNED_URL_EXPIRES_IN must be a positive integer',
      );
    }

    return {
      signedUrlExpiresInSeconds,
    };
  }

  private validateBucket(bucket: string): void {
    if (!bucket) {
      throw new InternalServerErrorException(
        'Storage bucket is not configured',
      );
    }
  }

  private validatePath(path: string): void {
    if (!path) {
      throw new InternalServerErrorException(
        'Storage file path is not configured',
      );
    }
  }
}
