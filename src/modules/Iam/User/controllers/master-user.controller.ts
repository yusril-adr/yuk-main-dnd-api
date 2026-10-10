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
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { CreateUserCommand } from '../commands/master/create-user/create-user.command';
import { CreateUserInput } from '../commands/master/create-user/create-user.input';
import { UpdateUserCommand } from '../commands/master/update-user/update-user.command';
import { UpdateUserInput } from '../commands/master/update-user/update-user.input';
import { RemoveUserCommand } from '../commands/master/remove-user/remove-user.command';
import { PaginateUsersQuery } from '../queries/master/paginate-users/paginate-users.query';
import { PaginateUsersInput } from '../queries/master/paginate-users/paginate-users.input';
import { FindOneUserQuery } from '../queries/master/find-one-user/find-one-user.query';

@Controller({
  path: 'master/iam/users',
  version: '1',
})
export class MasterUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions([PermissionEnum.USERS_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() payload: CreateUserInput) {
    await this.commandBus.execute(new CreateUserCommand(payload));
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'User created successfully',
    });
  }

  @Get()
  async paginate(@Query() query: PaginateUsersInput) {
    const output = await this.queryBus.execute(new PaginateUsersQuery(query));
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Users retrieved successfully',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const output = await this.queryBus.execute(new FindOneUserQuery(id));
    return wrapper.response({
      data: output,
      message: 'User retrieved successfully',
    });
  }

  @Patch(':id')
  @Permissions([PermissionEnum.USERS_UPDATE])
  async update(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Body() payload: UpdateUserInput,
  ) {
    await this.commandBus.execute(
      new UpdateUserCommand(id, payload, request.user),
    );
    return wrapper.response({
      data: null,
      message: 'User updated successfully',
    });
  }

  @Delete(':id')
  @Permissions([PermissionEnum.USERS_DELETE])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.commandBus.execute(new RemoveUserCommand(id, request.user));
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'User deleted successfully',
    });
  }
}
