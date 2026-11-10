import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { PaginateEventsQuery } from '../queries/board/paginate-events/paginate-events.query';
import { PaginateEventsInput } from '../queries/board/paginate-events/paginate-events.input';
import { FindOneEventQuery } from '../queries/board/find-one-event/find-one-event.query';
import { PaginateEventMembersQuery } from '../queries/board/paginate-event-members/paginate-event-members.query';
import { PaginateEventMembersInput } from '../queries/board/paginate-event-members/paginate-event-members.input';

@Controller({
  path: 'board/events',
  version: '1',
})
export class BoardEventController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions([PermissionEnum.PLAYER_BOARD_VIEW])
  async paginate(
    @Request() request: TRequestUser,
    @Query() query: PaginateEventsInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventsQuery(query, request.user),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Events retrieved successfully',
    });
  }

  @Get(':id/members')
  @Permissions([PermissionEnum.PLAYER_BOARD_VIEW])
  async paginateMembers(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Query() query: PaginateEventMembersInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventMembersQuery(id, query, request.user),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Event members retrieved successfully',
    });
  }

  @Get(':id')
  @Permissions([PermissionEnum.PLAYER_BOARD_VIEW])
  async findOne(@Request() request: TRequestUser, @Param('id') id: string) {
    const output = await this.queryBus.execute(
      new FindOneEventQuery(id, request.user),
    );
    return wrapper.response({
      data: output,
      message: 'Event retrieved successfully',
    });
  }
}
