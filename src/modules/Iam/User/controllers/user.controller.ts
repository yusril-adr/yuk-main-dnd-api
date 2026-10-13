import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Public } from '@shared/decorators/public.decorator';
import * as wrapper from '@shared/utils/wrapper';
import { PaginateUsersQuery } from '../queries/paginate-users/paginate-users.query';
import { PaginateUsersInput } from '../queries/paginate-users/paginate-users.input';
import { FindOneUserQuery } from '../queries/find-one-user/find-one-user.query';

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
