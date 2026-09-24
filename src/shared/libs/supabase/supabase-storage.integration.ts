import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClientIntegration } from './supabase-client.integration';
import type { TUploadedFile } from '@shared/types/uploaded-file.type';

type TSupabaseStorageSettings = {
  signedUrlExpiresInSeconds: number;
};

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
    const settings = this.getSettings();
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
      );
    }
  }

  async createSignedUrl(bucket: string, path: string): Promise<{
    url: string;
    expiresAt: Date;
  }> {
    const settings = this.getSettings();
    const client = this.supabaseClientIntegration.getClient();
    this.validateBucket(bucket);

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, settings.signedUrlExpiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new ServiceUnavailableException(
        'File storage is temporarily unavailable. Please try again later.',
      );
    }

    return {
      url: data.signedUrl,
      expiresAt: new Date(
        Date.now() + settings.signedUrlExpiresInSeconds * 1000,
      ),
    };
  }

  private getSettings(): TSupabaseStorageSettings {
    const signedUrlExpiresInSeconds = Number(
      this.configService.get<string>(
        'SUPABASE_SIGNED_URL_EXPIRES_IN',
        '900',
      ),
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
}
