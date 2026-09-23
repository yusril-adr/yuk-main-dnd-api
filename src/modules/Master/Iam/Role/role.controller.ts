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
} from '@nestjs/common';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { RoleCreateParamDto } from './dtos/params/role-create.param.dto';
import { RolePaginateParamDto } from './dtos/params/role-paginate.param.dto';
import { RoleUpdateParamDto } from './dtos/params/role-update.param.dto';
import { RoleService } from './role.service';

@Controller({
  path: 'master/iam/roles',
  version: '1',
})
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions([PermissionEnum.ROLES_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() payload: RoleCreateParamDto) {
    await this.roleService.create(payload);
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Role created successfully',
    });
  }

  @Get()
  async paginate(@Query() query: RolePaginateParamDto) {
    const [data, count] = await this.roleService.paginate(query);
    return wrapper.paginationResponse({
      data,
      count,
      query,
      message: 'Roles retrieved successfully',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.roleService.findOne(id);
    return wrapper.response({
      data: result,
      message: 'Role retrieved successfully',
    });
  }

  @Patch(':id')
  @Permissions([PermissionEnum.ROLES_UPDATE])
  async update(@Param('id') id: string, @Body() payload: RoleUpdateParamDto) {
    await this.roleService.update(id, payload);
    return wrapper.response({
      data: null,
      message: 'Role updated successfully',
    });
  }

  @Delete(':id')
  @Permissions([PermissionEnum.ROLES_DELETE])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id);
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Role deleted successfully',
    });
  }
}
