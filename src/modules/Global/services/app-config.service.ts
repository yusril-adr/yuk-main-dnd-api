import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const APP_DEBUG_KEY = 'APP_DEBUG';
export const DEFAULT_APP_DEBUG = false;

@Injectable()
export class AppConfigService {
  // Adds a `debug` field to error responses. Parsed once at startup so an
  // invalid value stops the app.
  readonly debug: boolean;

  constructor(configService: ConfigService) {
    this.debug = this.parseBoolean(
      configService.get<string>(APP_DEBUG_KEY),
      APP_DEBUG_KEY,
      DEFAULT_APP_DEBUG,
    );
  }

  private parseBoolean(
    raw: unknown,
    key: string,
    defaultValue: boolean,
  ): boolean {
    if (raw === undefined || raw === null || `${raw}`.trim() === '') {
      return defaultValue;
    }

    const value = `${raw}`.trim().toLowerCase();
    if (value !== 'true' && value !== 'false') {
      throw new Error(`Invalid env ${key}: must be true or false`);
    }

    return value === 'true';
  }
}
