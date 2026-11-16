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
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import type { TRequestUser } from '@shared/types/request.type';
import { PaginateEventCommentsQuery } from '../queries/paginate-event-comments/paginate-event-comments.query';
import { PaginateEventCommentsInput } from '../queries/paginate-event-comments/paginate-event-comments.input';
import { PaginateEventCommentRepliesQuery } from '../queries/paginate-event-comment-replies/paginate-event-comment-replies.query';
import { PaginateEventCommentRepliesInput } from '../queries/paginate-event-comment-replies/paginate-event-comment-replies.input';
import { PaginateEventCommentReactionsQuery } from '../queries/paginate-event-comment-reactions/paginate-event-comment-reactions.query';
import { PaginateEventCommentReactionsInput } from '../queries/paginate-event-comment-reactions/paginate-event-comment-reactions.input';
import { CreateEventCommentCommand } from '../commands/event-comment/create-event-comment/create-event-comment.command';
import { CreateEventCommentInput } from '../commands/event-comment/create-event-comment/create-event-comment.input';
import { UpdateEventCommentCommand } from '../commands/event-comment/update-event-comment/update-event-comment.command';
import { UpdateEventCommentInput } from '../commands/event-comment/update-event-comment/update-event-comment.input';
import { RemoveEventCommentCommand } from '../commands/event-comment/remove-event-comment/remove-event-comment.command';
import { PinEventCommentCommand } from '../commands/event-comment/pin-event-comment/pin-event-comment.command';
import { UnpinEventCommentCommand } from '../commands/event-comment/unpin-event-comment/unpin-event-comment.command';
import { SetEventCommentReactionCommand } from '../commands/event-comment/set-event-comment-reaction/set-event-comment-reaction.command';
import { SetEventCommentReactionInput } from '../commands/event-comment/set-event-comment-reaction/set-event-comment-reaction.input';
import { RemoveEventCommentReactionCommand } from '../commands/event-comment/remove-event-comment-reaction/remove-event-comment-reaction.command';

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

  @Get(':identifier/comments/:commentId/replies')
  @Public()
  async paginateReplies(
    @Param('identifier') identifier: string,
    @Param('commentId') commentId: string,
    @Query() query: PaginateEventCommentRepliesInput,
    @Request() request: Partial<TRequestUser>,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventCommentRepliesQuery(
        identifier,
        commentId,
        query,
        request.user ?? null,
      ),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Event comment replies retrieved successfully',
    });
  }

  @Get(':identifier/comments/:commentId/reactions')
  @Public()
  async paginateReactions(
    @Param('identifier') identifier: string,
    @Param('commentId') commentId: string,
    @Query() query: PaginateEventCommentReactionsInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateEventCommentReactionsQuery(identifier, commentId, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Event comment reactions retrieved successfully',
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

  @Put(':id/comments/:commentId/reaction')
  async setReaction(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() payload: SetEventCommentReactionInput,
  ) {
    await this.commandBus.execute(
      new SetEventCommentReactionCommand(id, commentId, payload, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Event comment reaction saved successfully',
    });
  }

  @Delete(':id/comments/:commentId/reaction')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    await this.commandBus.execute(
      new RemoveEventCommentReactionCommand(id, commentId, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Event comment reaction removed successfully',
    });
  }
}
