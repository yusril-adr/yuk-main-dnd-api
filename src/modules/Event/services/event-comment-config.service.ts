import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const MAX_PINNED_COMMENTS_PER_EVENT_KEY =
  'MAX_PINNED_COMMENTS_PER_EVENT';
export const DEFAULT_MAX_PINNED_COMMENTS_PER_EVENT = 1;

@Injectable()
export class EventCommentConfigService {
  // 0 means no limit. Parsed once at startup so an invalid value stops the app.
  readonly maxPinnedCommentsPerEvent: number;

  constructor(configService: ConfigService) {
    this.maxPinnedCommentsPerEvent = this.parseNonNegativeInt(
      configService.get<string>(MAX_PINNED_COMMENTS_PER_EVENT_KEY),
      MAX_PINNED_COMMENTS_PER_EVENT_KEY,
      DEFAULT_MAX_PINNED_COMMENTS_PER_EVENT,
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
