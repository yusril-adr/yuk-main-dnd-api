import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import { PaginateStoriesQuery } from '../queries/paginate-stories/paginate-stories.query';
import { PaginateStoriesInput } from '../queries/paginate-stories/paginate-stories.input';

@Controller({
  path: 'stories',
  version: '1',
})
export class StoryController {
  constructor(private readonly queryBus: QueryBus) {}

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
}
