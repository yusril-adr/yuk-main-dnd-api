import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { PaginatePermissionsQuery } from '../queries/master/paginate-permissions/paginate-permissions.query';
import { PaginatePermissionsInput } from '../queries/master/paginate-permissions/paginate-permissions.input';
import { PermissionOptionsQuery } from '../queries/master/permission-options/permission-options.query';
import { PermissionOptionsInput } from '../queries/master/permission-options/permission-options.input';

@Controller({
  path: 'master/iam/permissions',
  version: '1',
})
export class MasterPermissionController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions([PermissionEnum.PERMISSIONS_VIEW])
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

  @Get('options')
  async options(@Query() query: PermissionOptionsInput) {
    const output = await this.queryBus.execute(
      new PermissionOptionsQuery(query),
    );
    return wrapper.listResponse({
      data: output.data,
      total: output.data.length,
      message: 'Permission options retrieved successfully',
    });
  }
}
