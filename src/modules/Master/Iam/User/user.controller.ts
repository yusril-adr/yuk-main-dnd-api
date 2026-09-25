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
import * as wrapper from '@shared/utils/wrapper';
import { Permissions } from '@shared/decorators/permissions.decorator';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TRequestUser } from '@shared/types/request.type';
import { UserService } from './user.service';
import { UserPaginateParamDto } from './dtos/params/user-paginate.param.dto';
import { UserCreateParamDto } from './dtos/params/user-create.param.dto';
import { UserUpdateParamDto } from './dtos/params/user-update.param.dto';

@Controller({
  path: 'master/iam/users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Permissions([PermissionEnum.USERS_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() request: TRequestUser,
    @Body() payload: UserCreateParamDto,
  ) {
    await this.userService.create(payload);
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'User created successfully',
    });
  }

  @Get()
  async paginate(@Query() query: UserPaginateParamDto) {
    const [data, count] = await this.userService.paginate(query);
    return wrapper.paginationResponse({
      data,
      count,
      query,
      message: 'Users retrieved successfully',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.userService.findOne(id);
    return wrapper.response({
      data: result,
      message: 'User retrieved successfully',
    });
  }

  @Patch(':id')
  @Permissions([PermissionEnum.USERS_UPDATE])
  async update(
    @Request() request: TRequestUser,
    @Param('id') id: string,
    @Body() payload: UserUpdateParamDto,
  ) {
    await this.userService.update(id, payload, request.user);
    return wrapper.response({
      data: null,
      message: 'User updated successfully',
    });
  }

  @Delete(':id')
  @Permissions([PermissionEnum.USERS_DELETE])
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() request: TRequestUser, @Param('id') id: string) {
    await this.userService.remove(id, request.user);
    return wrapper.response({
      statusCode: HttpStatus.NO_CONTENT,
      data: null,
      message: 'User deleted successfully',
    });
  }
}
