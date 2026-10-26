import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const MAX_PINNED_COMMENTS_PER_STORY_KEY =
  'MAX_PINNED_COMMENTS_PER_STORY';
export const DEFAULT_MAX_PINNED_COMMENTS_PER_STORY = 1;

@Injectable()
export class StoryCommentConfigService {
  // 0 means no limit. Parsed once at startup so an invalid value stops the app.
  readonly maxPinnedCommentsPerStory: number;

  constructor(configService: ConfigService) {
    this.maxPinnedCommentsPerStory = this.parseNonNegativeInt(
      configService.get<string>(MAX_PINNED_COMMENTS_PER_STORY_KEY),
      MAX_PINNED_COMMENTS_PER_STORY_KEY,
      DEFAULT_MAX_PINNED_COMMENTS_PER_STORY,
    );
  }

  private parseNonNegativeInt(
    raw: unknown,
    key: string,
    defaultValue: number,
  ): number {
    if (raw === undefined || raw === null || `${raw}`.trim() === '') {
      return defaultValue;
    }

    const value = `${raw}`.trim();
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error(
        `Invalid env ${key}: must be an integer greater than or equal to 0`,
      );
    }

    return Number(value);
  }
}
