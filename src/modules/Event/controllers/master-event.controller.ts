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
import { PaginateEventsQuery } from '../queries/master/paginate-events/paginate-events.query';
import { PaginateEventsInput } from '../queries/master/paginate-events/paginate-events.input';
import { FindOneEventQuery } from '../queries/master/find-one-event/find-one-event.query';

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
