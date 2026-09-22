import { Controller, Get } from '@nestjs/common';
import { AppService } from '@modules/App/app.service';
import type { TResponse } from '@shared/types/response.type';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  checkStatusRunning(): TResponse {
    const result = this.appService.checkStatusRunning();

    return wrapper.response({
      message: result,
    });
  }

  @Get('/debug-sentry')
  @Public()
  getError() {
    throw new Error('Test Sentry error!');
  }
}
