import { Controller, Get, Query, Request } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { PaginateStoriesQuery } from '../queries/board/paginate-stories/paginate-stories.query';
import { PaginateStoriesInput } from '../queries/board/paginate-stories/paginate-stories.input';

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
}
