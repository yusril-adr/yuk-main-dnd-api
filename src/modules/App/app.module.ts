import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppController } from '@modules/App/controllers/app.controller';
import { CheckStatusHandler } from '@modules/App/queries/check-status/check-status.handler';
import { DebugSentryHandler } from '@modules/App/queries/debug-sentry/debug-sentry.handler';

const queryHandlers = [CheckStatusHandler, DebugSentryHandler];

@Module({
  imports: [CqrsModule],
  controllers: [AppController],
  providers: [...queryHandlers],
})
export class AppModule {}
