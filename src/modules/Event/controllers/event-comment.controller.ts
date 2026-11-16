import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import type { TRequestUser } from '@shared/types/request.type';
import { PaginateEventCommentsQuery } from '../queries/paginate-event-comments/paginate-event-comments.query';
import { PaginateEventCommentsInput } from '../queries/paginate-event-comments/paginate-event-comments.input';
import { CreateEventCommentCommand } from '../commands/event-comment/create-event-comment/create-event-comment.command';
import { CreateEventCommentInput } from '../commands/event-comment/create-event-comment/create-event-comment.input';
import { UpdateEventCommentCommand } from '../commands/event-comment/update-event-comment/update-event-comment.command';
import { UpdateEventCommentInput } from '../commands/event-comment/update-event-comment/update-event-comment.input';
import { RemoveEventCommentCommand } from '../commands/event-comment/remove-event-comment/remove-event-comment.command';
import { PinEventCommentCommand } from '../commands/event-comment/pin-event-comment/pin-event-comment.command';
import { UnpinEventCommentCommand } from '../commands/event-comment/unpin-event-comment/unpin-event-comment.command';

@Controller({
  path: 'events',
  version: '1',
})
export class EventCommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':identifier/comments')
  @Public()
  async paginate(
    @Param('identifier') identifier: string,
    @Query() query: PaginateEventCommentsInput,
    @Request() request: Partial<TRequestUser>,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventCommentsQuery(identifier, query, request.user ?? null),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Event comments retrieved successfully',
    });
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Body() payload: CreateEventCommentInput,
  ) {
    const output = await this.commandBus.execute(
      new CreateEventCommentCommand(id, payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: output,
      message: 'Event comment created successfully',
    });
  }

  @Patch(':id/comments/:commentId')
  async update(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() payload: UpdateEventCommentInput,
  ) {
    await this.commandBus.execute(
      new UpdateEventCommentCommand(id, commentId, payload, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Event comment updated successfully',
    });
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    await this.commandBus.execute(
      new RemoveEventCommentCommand(id, commentId, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Event comment deleted successfully',
    });
  }

  @Patch(':id/comments/:commentId/pin')
  async pin(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    await this.commandBus.execute(
      new PinEventCommentCommand(id, commentId, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Event comment pinned successfully',
    });
  }

  @Patch(':id/comments/:commentId/unpin')
  async unpin(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    await this.commandBus.execute(
      new UnpinEventCommentCommand(id, commentId, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Event comment unpinned successfully',
    });
  }
}
