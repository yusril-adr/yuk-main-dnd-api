import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { PaginatePermissionsQuery } from '../queries/master/paginate-permissions/paginate-permissions.query';
import { PaginatePermissionsInput } from '../queries/master/paginate-permissions/paginate-permissions.input';
import { FindAllPermissionsQuery } from '../queries/master/find-all-permissions/find-all-permissions.query';
import { FindAllPermissionsInput } from '../queries/master/find-all-permissions/find-all-permissions.input';

@Controller({
  path: 'master/iam/permissions',
  version: '1',
})
export class MasterPermissionController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async paginate(@Query() query: PaginatePermissionsInput) {
    const output = await this.queryBus.execute(
      new PaginatePermissionsQuery(query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Permissions retrieved successfully',
    });
  }

  @Get('full')
  async findAll(@Query() query: FindAllPermissionsInput) {
    const output = await this.queryBus.execute(
      new FindAllPermissionsQuery(query),
    );
    return wrapper.listResponse({
      data: output.data,
      total: output.data.length,
      message: 'Permissions retrieved successfully',
    });
  }
}
