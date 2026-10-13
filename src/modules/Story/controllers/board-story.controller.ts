import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { PaginateStoriesQuery } from '../queries/board/paginate-stories/paginate-stories.query';
import { PaginateStoriesInput } from '../queries/board/paginate-stories/paginate-stories.input';
import { FindOneStoryQuery } from '../queries/board/find-one-story/find-one-story.query';
import { PaginateStoryMembersQuery } from '../queries/board/paginate-story-members/paginate-story-members.query';
import { PaginateStoryMembersInput } from '../queries/board/paginate-story-members/paginate-story-members.input';

@Controller({
  path: 'board/stories',
  version: '1',
})
export class BoardStoryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions([PermissionEnum.PLAYER_BOARD_VIEW])
  async paginate(
    @Request() request: TRequestUser,
    @Query() query: PaginateStoriesInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateStoriesQuery(query, request.user),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Stories retrieved successfully',
    });
  }

  @Get(':id/members')
  @Permissions([PermissionEnum.PLAYER_BOARD_VIEW])
  async paginateMembers(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Query() query: PaginateStoryMembersInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateStoryMembersQuery(id, query, request.user),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Story members retrieved successfully',
    });
  }

  @Get(':id')
  @Permissions([PermissionEnum.PLAYER_BOARD_VIEW])
  async findOne(@Request() request: TRequestUser, @Param('id') id: string) {
    const output = await this.queryBus.execute(
      new FindOneStoryQuery(id, request.user),
    );
    return wrapper.response({
      data: output,
      message: 'Story retrieved successfully',
    });
  }
}
