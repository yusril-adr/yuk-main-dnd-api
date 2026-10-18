import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { DebugSentryQuery } from '@modules/App/queries/debug-sentry/debug-sentry.query';

@QueryHandler(DebugSentryQuery)
export class DebugSentryHandler implements IQueryHandler<
  DebugSentryQuery,
  never
> {
  execute(): Promise<never> {
    return Promise.reject(new Error('Test Sentry error!'));
  }
}
