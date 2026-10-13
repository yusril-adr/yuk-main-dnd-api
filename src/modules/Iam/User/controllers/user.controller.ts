import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Public } from '@shared/decorators/public.decorator';
import * as wrapper from '@shared/utils/wrapper';
import { PaginatePublicUsersInput } from '../queries/paginate-public-users/paginate-public-users.input';
import { PaginatePublicUsersQuery } from '../queries/paginate-public-users/paginate-public-users.query';
import { FindOnePublicUserQuery } from '../queries/find-one-public-user/find-one-public-user.query';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Public()
  async paginate(@Query() query: PaginatePublicUsersInput) {
    const output = await this.queryBus.execute(
      new PaginatePublicUsersQuery(query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query: { page: query.page, perPage: query.perPage },
      message: 'Users retrieved successfully',
    });
  }

  @Get(':identifier')
  @Public()
  async findOne(@Param('identifier') identifier: string) {
    const output = await this.queryBus.execute(
      new FindOnePublicUserQuery(identifier),
    );
    return wrapper.response({
      data: output,
      message: 'User retrieved successfully',
    });
  }
}
