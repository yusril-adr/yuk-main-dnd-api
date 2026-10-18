import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { CheckStatusQuery } from '@modules/App/queries/check-status/check-status.query';
import { CheckStatusOutput } from '@modules/App/queries/check-status/check-status.output';

@QueryHandler(CheckStatusQuery)
export class CheckStatusHandler implements IQueryHandler<
  CheckStatusQuery,
  CheckStatusOutput
> {
  execute(): Promise<CheckStatusOutput> {
    return Promise.resolve(
      new CheckStatusOutput('This service is running properly'),
    );
  }
}
