import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { TResponse } from '@shared/types/response.type';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import { CheckStatusQuery } from '@modules/App/queries/check-status/check-status.query';
import type { CheckStatusOutput } from '@modules/App/queries/check-status/check-status.output';
import { DebugSentryQuery } from '@modules/App/queries/debug-sentry/debug-sentry.query';

@Controller()
export class AppController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Public()
  async checkStatusRunning(): Promise<TResponse> {
    const output = await this.queryBus.execute<
      CheckStatusQuery,
      CheckStatusOutput
    >(new CheckStatusQuery());

    return wrapper.response({
      message: output.message,
    });
  }

  @Get('/debug-sentry')
  @Public()
  async getError(): Promise<void> {
    await this.queryBus.execute<DebugSentryQuery, never>(
      new DebugSentryQuery(),
    );
  }
}
