import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import type { TRequestUser } from '@shared/types/request.type';
import { PaginateEventsQuery } from '../queries/paginate-events/paginate-events.query';
import { PaginateEventsInput } from '../queries/paginate-events/paginate-events.input';
import { FindOneEventQuery } from '../queries/find-one-event/find-one-event.query';
import { PaginateEventMembersQuery } from '../queries/paginate-event-members/paginate-event-members.query';
import { PaginateEventMembersInput } from '../queries/paginate-event-members/paginate-event-members.input';
import { JoinEventCommand } from '../commands/join-event/join-event.command';
import { CancelJoinEventCommand } from '../commands/cancel-join-event/cancel-join-event.command';

@Controller({ path: 'events', version: '1' })
export class EventController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
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
  async findOne(
    @Param('identifier') identifier: string,
    @Request() request: Partial<TRequestUser>,
  ) {
    const output = await this.queryBus.execute(
      new FindOneEventQuery(identifier, request.user ?? null),
    );
    return wrapper.response({
      data: output,
      message: 'Event retrieved successfully',
    });
  }
  @Get(':identifier/members')
  @Public()
  async paginateMembers(
    @Param('identifier') identifier: string,
    @Query() query: PaginateEventMembersInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventMembersQuery(identifier, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Event members retrieved successfully',
    });
  }
  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  async join(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new JoinEventCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Event joined successfully',
    });
  }
  @Post(':id/cancel-join')
  @HttpCode(HttpStatus.OK)
  async cancelJoin(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new CancelJoinEventCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.OK,
      data: null,
      message: 'Event join cancelled successfully',
    });
  }
}
