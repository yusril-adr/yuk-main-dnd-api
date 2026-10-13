import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Public } from '@shared/decorators/public.decorator';
import * as wrapper from '@shared/utils/wrapper';
import { PaginateUsersQuery } from '../queries/paginate-users/paginate-users.query';
import { PaginateUsersInput } from '../queries/paginate-users/paginate-users.input';
import { GetTopDmExperienceQuery } from '../queries/get-top-dm-experience/get-top-dm-experience.query';
import { GetTopDmExperienceInput } from '../queries/get-top-dm-experience/get-top-dm-experience.input';
import { GetTopPlayerExperienceQuery } from '../queries/get-top-player-experience/get-top-player-experience.query';
import { GetTopPlayerExperienceInput } from '../queries/get-top-player-experience/get-top-player-experience.input';
import { FindOneUserQuery } from '../queries/find-one-user/find-one-user.query';
import { PaginateUserStoriesQuery } from '@modules/Story/queries/paginate-user-stories/paginate-user-stories.query';
import { PaginateUserStoriesInput } from '@modules/Story/queries/paginate-user-stories/paginate-user-stories.input';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Public()
  async paginate(@Query() query: PaginateUsersInput) {
    const output = await this.queryBus.execute(new PaginateUsersQuery(query));
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Users retrieved successfully',
    });
  }

  @Get('top-dm-experience')
  @Public()
  async getTopDmExperience(@Query() query: GetTopDmExperienceInput) {
    const output = await this.queryBus.execute(
      new GetTopDmExperienceQuery(query),
    );
    return wrapper.response({
      data: output.data,
      message: 'Top dungeon masters retrieved successfully',
    });
  }

  @Get('top-player-experience')
  @Public()
  async getTopPlayerExperience(@Query() query: GetTopPlayerExperienceInput) {
    const output = await this.queryBus.execute(
      new GetTopPlayerExperienceQuery(query),
    );
    return wrapper.response({
      data: output.data,
      message: 'Top players retrieved successfully',
    });
  }

  @Get(':identifier/created-stories')
  @Public()
  async paginateStories(
    @Param('identifier') identifier: string,
    @Query() query: PaginateUserStoriesInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateUserStoriesQuery(identifier, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Stories retrieved successfully',
    });
  }

  @Get(':identifier')
  @Public()
  async findOne(@Param('identifier') identifier: string) {
    const output = await this.queryBus.execute(
      new FindOneUserQuery(identifier),
    );
    return wrapper.response({
      data: output,
      message: 'User retrieved successfully',
    });
  }
}
