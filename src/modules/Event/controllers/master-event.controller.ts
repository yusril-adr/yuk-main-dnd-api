import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { CreateEventCommand } from '../commands/master/create-event/create-event.command';
import { CreateEventInput } from '../commands/master/create-event/create-event.input';
import { UpdateEventCommand } from '../commands/master/update-event/update-event.command';
import { UpdateEventInput } from '../commands/master/update-event/update-event.input';
import { RemoveEventCommand } from '../commands/master/remove-event/remove-event.command';
import { AddEventMembersCommand } from '../commands/master/add-event-members/add-event-members.command';
import { AddEventMembersInput } from '../commands/master/add-event-members/add-event-members.input';
import { RemoveEventMembersCommand } from '../commands/master/remove-event-members/remove-event-members.command';
import { RemoveEventMembersInput } from '../commands/master/remove-event-members/remove-event-members.input';
import { PaginateEventsQuery } from '../queries/master/paginate-events/paginate-events.query';
import { PaginateEventsInput } from '../queries/master/paginate-events/paginate-events.input';
import { FindOneEventQuery } from '../queries/master/find-one-event/find-one-event.query';
import { PaginateEventMembersQuery } from '../queries/master/paginate-event-members/paginate-event-members.query';
import { PaginateEventMembersInput } from '../queries/master/paginate-event-members/paginate-event-members.input';
import { PaginateAvailableEventUsersQuery } from '../queries/master/paginate-available-event-users/paginate-available-event-users.query';
import { PaginateAvailableEventUsersInput } from '../queries/master/paginate-available-event-users/paginate-available-event-users.input';
import { PublishEventCommand } from '../commands/master/publish-event/publish-event.command';
import { ArchiveEventCommand } from '../commands/master/archive-event/archive-event.command';
import { UnarchiveEventCommand } from '../commands/master/unarchive-event/unarchive-event.command';
import { CancelEventCommand } from '../commands/master/cancel-event/cancel-event.command';

@Controller({ path: 'master/events', version: '1' })
export class MasterEventController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @Post()
  @Permissions([PermissionEnum.EVENTS_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() request: TRequestUser,
    @Body() payload: CreateEventInput,
  ) {
    await this.commandBus.execute(
      new CreateEventCommand(payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Event created successfully',
    });
  }
  @Get()
  @Permissions([PermissionEnum.EVENTS_VIEW])
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
  @Get(':id')
  @Permissions([PermissionEnum.EVENTS_VIEW])
  async findOne(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const output = await this.queryBus.execute(
      new FindOneEventQuery(id, request.user),
    );
    return wrapper.response({
      data: output,
      message: 'Event retrieved successfully',
    });
  }
  @Patch(':id')
  async update(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: UpdateEventInput,
  ) {
    await this.commandBus.execute(
      new UpdateEventCommand(id, payload, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Event updated successfully',
    });
  }
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMembers(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: AddEventMembersInput,
  ) {
    await this.commandBus.execute(
      new AddEventMembersCommand(id, payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Event members added successfully',
    });
  }
  @Delete(':id/members')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMembers(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() payload: RemoveEventMembersInput,
  ) {
    await this.commandBus.execute(
      new RemoveEventMembersCommand(id, payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Event members removed successfully',
    });
  }
  @Get(':id/members')
  @Permissions([PermissionEnum.EVENTS_VIEW])
  async paginateMembers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: PaginateEventMembersInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventMembersQuery(id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Event members retrieved successfully',
    });
  }
  @Get(':id/available-users')
  @Permissions([PermissionEnum.EVENTS_VIEW])
  async paginateAvailableUsers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: PaginateAvailableEventUsersInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateAvailableEventUsersQuery(id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Available event users retrieved successfully',
    });
  }
  @Patch(':id/archive')
  async archive(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.commandBus.execute(new ArchiveEventCommand(id, request.user));
    return wrapper.response({
      data: null,
      message: 'Event archived successfully',
    });
  }
  @Patch(':id/publish')
  async publish(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.commandBus.execute(new PublishEventCommand(id, request.user));
    return wrapper.response({
      data: null,
      message: 'Event published successfully',
    });
  }
  @Patch(':id/unarchive')
  async unarchive(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.commandBus.execute(new UnarchiveEventCommand(id, request.user));
    return wrapper.response({
      data: null,
      message: 'Event unarchived successfully',
    });
  }
  @Patch(':id/cancel')
  async cancel(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.commandBus.execute(new CancelEventCommand(id, request.user));
    return wrapper.response({
      data: null,
      message: 'Event cancelled successfully',
    });
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() request: TRequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.commandBus.execute(new RemoveEventCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Event deleted successfully',
    });
  }
}
