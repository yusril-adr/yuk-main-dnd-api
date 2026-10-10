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
import { AddUserExperiencePointsCommand } from '../commands/master/add-user-experience-points/add-user-experience-points.command';
import { AddUserExperiencePointsInput } from '../commands/master/add-user-experience-points/add-user-experience-points.input';
import { AddUserPointsCommand } from '../commands/master/add-user-points/add-user-points.command';
import { AddUserPointsInput } from '../commands/master/add-user-points/add-user-points.input';
import { PaginateUsersQuery } from '../queries/master/paginate-users/paginate-users.query';
import { PaginateUsersInput } from '../queries/master/paginate-users/paginate-users.input';
import { FindOneUserQuery } from '../queries/master/find-one-user/find-one-user.query';
import { PaginateUserExperiencePointsQuery } from '../queries/master/paginate-user-experience-points/paginate-user-experience-points.query';
import { PaginateUserExperiencePointsInput } from '../queries/master/paginate-user-experience-points/paginate-user-experience-points.input';
import { PaginateUserPointsQuery } from '../queries/master/paginate-user-points/paginate-user-points.query';
import { PaginateUserPointsInput } from '../queries/master/paginate-user-points/paginate-user-points.input';

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

  @Get(':id/experience-points')
  async paginateExperiencePoints(
    @Param('id') id: string,
    @Query() query: PaginateUserExperiencePointsInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateUserExperiencePointsQuery(id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Experience points retrieved successfully',
    });
  }

  @Post(':id/experience-points')
  @Permissions([PermissionEnum.POINTS_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async addExperiencePoints(
    @Param('id') id: string,
    @Body() payload: AddUserExperiencePointsInput,
  ) {
    await this.commandBus.execute(
      new AddUserExperiencePointsCommand(id, payload),
    );
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Experience points added successfully',
    });
  }

  @Get(':id/points')
  async paginatePoints(
    @Param('id') id: string,
    @Query() query: PaginateUserPointsInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateUserPointsQuery(id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Points retrieved successfully',
    });
  }

  @Post(':id/points')
  @Permissions([PermissionEnum.POINTS_CREATE])
  @HttpCode(HttpStatus.CREATED)
  async addPoints(
    @Param('id') id: string,
    @Body() payload: AddUserPointsInput,
  ) {
    await this.commandBus.execute(new AddUserPointsCommand(id, payload));
    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Points added successfully',
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
