import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import { ListSchedulesQuery } from '../queries/list-schedules/list-schedules.query';
import { ListSchedulesInput } from '../queries/list-schedules/list-schedules.input';

@Controller({
  path: 'schedules',
  version: '1',
})
export class ScheduleController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Public()
  async list(@Query() query: ListSchedulesInput) {
    const output = await this.queryBus.execute(new ListSchedulesQuery(query));
    return wrapper.listResponse({
      data: output.data,
      total: output.total,
      message: 'Schedules retrieved successfully',
    });
  }
}
