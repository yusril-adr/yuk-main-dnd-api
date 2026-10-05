import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { basename, extname } from 'path';

@Injectable()
export class StoryBannerPathService {
  constructor(private readonly configService: ConfigService) {}

  getBucket(): string {
    const bucket = this.configService.get<string>('FILE_STORY_BANNER_BUCKET');
    if (!bucket) {
      throw new InternalServerErrorException(
        'FILE_STORY_BANNER_BUCKET is not configured',
      );
    }

    return bucket;
  }

  createTemporaryPath(originalName: string): string {
    return `${this.getPathPrefix()}/temporary/${this.createFilename(originalName)}`;
  }

  createPromotedPath(storyId: string, temporaryPath: string): string {
    return `${this.getPathPrefix()}/${storyId}/${basename(temporaryPath)}`;
  }

  isTemporaryPath(path: string): boolean {
    return path.startsWith(`${this.getPathPrefix()}/temporary/`);
  }

  private getPathPrefix(): string {
    return this.configService.get<string>(
      'FILE_STORY_BANNER_PATH_PREFIX',
      'stories',
    );
  }

  private createFilename(originalName: string): string {
    return `${randomUUID()}${extname(originalName).toLowerCase()}`;
  }
}
