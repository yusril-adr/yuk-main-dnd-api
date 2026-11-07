import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import { PaginateEventsQuery } from '../queries/paginate-events/paginate-events.query';
import { PaginateEventsInput } from '../queries/paginate-events/paginate-events.input';
import { FindOneEventQuery } from '../queries/find-one-event/find-one-event.query';

@Controller({ path: 'events', version: '1' })
export class EventController {
  constructor(private readonly queryBus: QueryBus) {}
  @Get()
  @Public()
  async paginate(@Query() query: PaginateEventsInput) {
    const output = await this.queryBus.execute(new PaginateEventsQuery(query));
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Events retrieved successfully',
    });
  }
  @Get(':identifier')
  @Public()
  async findOne(@Param('identifier') identifier: string) {
    const output = await this.queryBus.execute(
      new FindOneEventQuery(identifier),
    );
    return wrapper.response({
      data: output,
      message: 'Event retrieved successfully',
    });
  }
}
