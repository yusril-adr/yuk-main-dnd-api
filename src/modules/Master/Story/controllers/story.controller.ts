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
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { CreateStoryCommand } from '../commands/create-story/create-story.command';
import { CreateStoryInput } from '../commands/create-story/create-story.input';
import { UpdateStoryCommand } from '../commands/update-story/update-story.command';
import { UpdateStoryInput } from '../commands/update-story/update-story.input';
import { RemoveStoryCommand } from '../commands/remove-story/remove-story.command';
import { PaginateStoriesQuery } from '../queries/paginate-stories/paginate-stories.query';
import { PaginateStoriesInput } from '../queries/paginate-stories/paginate-stories.input';
import { FindOneStoryQuery } from '../queries/find-one-story/find-one-story.query';

@Controller({
  path: 'master/stories',
  version: '1',
})
export class StoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions([PermissionEnum.STORIES_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() request: TRequestUser,
    @Body() payload: CreateStoryInput,
  ) {
    await this.commandBus.execute(
      new CreateStoryCommand(payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Story created successfully',
    });
  }

  @Get()
  @Permissions([PermissionEnum.STORIES_VIEW])
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
  @Permissions([PermissionEnum.STORIES_VIEW])
  async findOne(@Param('id') id: string) {
    const output = await this.queryBus.execute(new FindOneStoryQuery(id));
    return wrapper.response({
      data: output.data,
      message: 'Story retrieved successfully',
    });
  }

  @Patch(':id')
  @Permissions([PermissionEnum.STORIES_UPDATE])
  async update(@Param('id') id: string, @Body() payload: UpdateStoryInput) {
    await this.commandBus.execute(new UpdateStoryCommand(id, payload));
    return wrapper.response({
      data: null,
      message: 'Story updated successfully',
    });
  }

  @Delete(':id')
  @Permissions([PermissionEnum.STORIES_DELETE])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.commandBus.execute(new RemoveStoryCommand(id));
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Story deleted successfully',
    });
  }
}
