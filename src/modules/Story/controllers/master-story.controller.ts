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
import { CreateStoryCommand } from '../commands/master/create-story/create-story.command';
import { CreateStoryInput } from '../commands/master/create-story/create-story.input';
import { UpdateStoryCommand } from '../commands/master/update-story/update-story.command';
import { UpdateStoryInput } from '../commands/master/update-story/update-story.input';
import { AddStoryMembersCommand } from '../commands/master/add-story-members/add-story-members.command';
import { AddStoryMembersInput } from '../commands/master/add-story-members/add-story-members.input';
import { RemoveStoryCommand } from '../commands/master/remove-story/remove-story.command';
import { ArchiveStoryCommand } from '../commands/master/archive-story/archive-story.command';
import { UnarchiveStoryCommand } from '../commands/master/unarchive-story/unarchive-story.command';
import { PaginateStoriesQuery } from '../queries/master/paginate-stories/paginate-stories.query';
import { PaginateStoriesInput } from '../queries/master/paginate-stories/paginate-stories.input';
import { FindOneStoryQuery } from '../queries/master/find-one-story/find-one-story.query';
import { GetStoryMembersQuery } from '../queries/master/get-story-members/get-story-members.query';
import { GetAvailableStoryUsersQuery } from '../queries/master/get-available-story-users/get-available-story-users.query';
import { GetAvailableStoryUsersInput } from '../queries/master/get-available-story-users/get-available-story-users.input';

@Controller({
  path: 'master/stories',
  version: '1',
})
export class MasterStoryController {
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
  async findOne(@Param('id') id: string) {
    const output = await this.queryBus.execute(new FindOneStoryQuery(id));
    return wrapper.response({
      data: output.data,
      message: 'Story retrieved successfully',
    });
  }

  @Patch(':id')
  async update(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Body() payload: UpdateStoryInput,
  ) {
    await this.commandBus.execute(
      new UpdateStoryCommand(id, payload, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'Story updated successfully',
    });
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMembers(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Body() payload: AddStoryMembersInput,
  ) {
    await this.commandBus.execute(
      new AddStoryMembersCommand(id, payload, request.user),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Story members added successfully',
    });
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    const output = await this.queryBus.execute(new GetStoryMembersQuery(id));
    return wrapper.listResponse({
      data: output.data,
      total: output.data.length,
      message: 'Story members retrieved successfully',
    });
  }

  @Get(':id/available-users')
  async getAvailableUsers(
    @Param('id') id: string,
    @Query() query: GetAvailableStoryUsersInput,
  ) {
    const output = await this.queryBus.execute(
      new GetAvailableStoryUsersQuery(id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Available story users retrieved successfully',
    });
  }

  @Patch(':id/archive')
  async archive(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new ArchiveStoryCommand(id, request.user));
    return wrapper.response({
      data: null,
      message: 'Story archived successfully',
    });
  }

  @Patch(':id/unarchive')
  async unarchive(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new UnarchiveStoryCommand(id, request.user));
    return wrapper.response({
      data: null,
      message: 'Story unarchived successfully',
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new RemoveStoryCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Story deleted successfully',
    });
  }
}
