import { Controller, Get, Query } from '@nestjs/common';
import * as wrapper from '@shared/utils/wrapper';
import { PermissionService } from './permission.service';
import { PermissionFullListParamDto } from './dtos/params/permission-full-list.param.dto';
import { PermissionPaginateParamDto } from './dtos/params/permission-paginate.param.dto';

@Controller({
  path: 'master/iam/permissions',
  version: '1',
})
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  async paginate(@Query() query: PermissionPaginateParamDto) {
    const [data, count] = await this.permissionService.paginate(query);
    return wrapper.paginationResponse({
      data,
      count,
      query,
      message: 'Permissions retrieved successfully',
    });
  }

  @Get('full')
  async findAll(@Query() query: PermissionFullListParamDto) {
    const data = await this.permissionService.findAll(query);
    return wrapper.listResponse({
      data,
      total: data.length,
      message: 'Permissions retrieved successfully',
    });
  }
}
