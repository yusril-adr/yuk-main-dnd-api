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
import { PaginateStoriesQuery } from '../queries/paginate-stories/paginate-stories.query';
import { PaginateStoriesInput } from '../queries/paginate-stories/paginate-stories.input';
import { FindOneStoryQuery } from '../queries/find-one-story/find-one-story.query';
import { JoinStoryCommand } from '../commands/join-story/join-story.command';
import { CancelJoinStoryCommand } from '../commands/cancel-join-story/cancel-join-story.command';

@Controller({
  path: 'stories',
  version: '1',
})
export class StoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Public()
  async paginate(@Query() query: PaginateStoriesInput) {
    const output = await this.queryBus.execute(new PaginateStoriesQuery(query));
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Stories retrieved successfully',
    });
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @Request() request: Partial<TRequestUser>,
  ) {
    const output = await this.queryBus.execute(
      new FindOneStoryQuery(id, request.user?.id ?? null),
    );
    return wrapper.response({
      data: output,
      message: 'Story retrieved successfully',
    });
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  async join(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new JoinStoryCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Story joined successfully',
    });
  }

  @Post(':id/cancel-join')
  @HttpCode(HttpStatus.OK)
  async cancelJoin(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new CancelJoinStoryCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.OK,
      data: null,
      message: 'Story join cancelled successfully',
    });
  }
}
