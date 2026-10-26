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
import { PaginateStoryCommentsQuery } from '../queries/paginate-story-comments/paginate-story-comments.query';
import { PaginateStoryCommentsInput } from '../queries/paginate-story-comments/paginate-story-comments.input';
import { PaginateStoryCommentRepliesQuery } from '../queries/paginate-story-comment-replies/paginate-story-comment-replies.query';
import { PaginateStoryCommentRepliesInput } from '../queries/paginate-story-comment-replies/paginate-story-comment-replies.input';
import { CreateStoryCommentCommand } from '../commands/story-comment/create-story-comment/create-story-comment.command';
import { CreateStoryCommentInput } from '../commands/story-comment/create-story-comment/create-story-comment.input';
import { UpdateStoryCommentCommand } from '../commands/story-comment/update-story-comment/update-story-comment.command';
import { UpdateStoryCommentInput } from '../commands/story-comment/update-story-comment/update-story-comment.input';
import { RemoveStoryCommentCommand } from '../commands/story-comment/remove-story-comment/remove-story-comment.command';
import { PinStoryCommentCommand } from '../commands/story-comment/pin-story-comment/pin-story-comment.command';
import { UnpinStoryCommentCommand } from '../commands/story-comment/unpin-story-comment/unpin-story-comment.command';

@Controller({
  path: 'stories',
  version: '1',
})
export class StoryCommentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':identifier/comments')
  @Public()
  async paginate(
    @Param('identifier') identifier: string,
    @Query() query: PaginateStoryCommentsInput,
    @Request() request: Partial<TRequestUser>,
  ) {
    const output = await this.queryBus.execute(
      new PaginateStoryCommentsQuery(identifier, query, request.user ?? null),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Story comments retrieved successfully',
    });
  }

  @Get(':identifier/comments/:commentId/replies')
  @Public()
  async paginateReplies(
    @Param('identifier') identifier: string,
    @Param('commentId') commentId: string,
    @Query() query: PaginateStoryCommentRepliesInput,
    @Request() request: Partial<TRequestUser>,
  ) {
    const output = await this.queryBus.execute(
      new PaginateStoryCommentRepliesQuery(
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
      message: 'Story comment replies retrieved successfully',
    });
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Body() payload: CreateStoryCommentInput,
  ) {
    const output = await this.commandBus.execute(
      new CreateStoryCommentCommand(id, payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: output,
      message: 'Story comment created successfully',
    });
  }

  @Patch(':id/comments/:commentId')
  async update(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() payload: UpdateStoryCommentInput,
  ) {
    await this.commandBus.execute(
      new UpdateStoryCommentCommand(id, commentId, payload, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Story comment updated successfully',
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
      new RemoveStoryCommentCommand(id, commentId, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Story comment deleted successfully',
    });
  }

  @Patch(':id/comments/:commentId/pin')
  async pin(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    await this.commandBus.execute(
      new PinStoryCommentCommand(id, commentId, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Story comment pinned successfully',
    });
  }

  @Patch(':id/comments/:commentId/unpin')
  async unpin(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    await this.commandBus.execute(
      new UnpinStoryCommentCommand(id, commentId, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Story comment unpinned successfully',
    });
  }
}
