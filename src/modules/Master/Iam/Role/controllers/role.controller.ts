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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { CreateRoleCommand } from '../commands/create-role/create-role.command';
import { CreateRoleInput } from '../commands/create-role/create-role.input';
import { UpdateRoleCommand } from '../commands/update-role/update-role.command';
import { UpdateRoleInput } from '../commands/update-role/update-role.input';
import { RemoveRoleCommand } from '../commands/remove-role/remove-role.command';
import { PaginateRolesQuery } from '../queries/paginate-roles/paginate-roles.query';
import { PaginateRolesInput } from '../queries/paginate-roles/paginate-roles.input';
import { FindOneRoleQuery } from '../queries/find-one-role/find-one-role.query';

@Controller({
  path: 'master/iam/roles',
  version: '1',
})
export class RoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions([PermissionEnum.ROLES_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() payload: CreateRoleInput) {
    await this.commandBus.execute(new CreateRoleCommand(payload));
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Role created successfully',
    });
  }

  @Get()
  async paginate(@Query() query: PaginateRolesInput) {
    const output = await this.queryBus.execute(new PaginateRolesQuery(query));
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Roles retrieved successfully',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const output = await this.queryBus.execute(new FindOneRoleQuery(id));
    return wrapper.response({
      data: output.data,
      message: 'Role retrieved successfully',
    });
  }

  @Patch(':id')
  @Permissions([PermissionEnum.ROLES_UPDATE])
  async update(@Param('id') id: string, @Body() payload: UpdateRoleInput) {
    await this.commandBus.execute(new UpdateRoleCommand(id, payload));
    return wrapper.response({
      data: null,
      message: 'Role updated successfully',
    });
  }

  @Delete(':id')
  @Permissions([PermissionEnum.ROLES_DELETE])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.commandBus.execute(new RemoveRoleCommand(id));
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'Role deleted successfully',
    });
  }
}