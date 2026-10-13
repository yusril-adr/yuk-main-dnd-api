import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import type { TRequestUser } from '@shared/types/request.type';
import { LoginCommand } from '../commands/login/login.command';
import { LoginInput } from '../commands/login/login.input';
import { SwitchRoleCommand } from '../commands/switch-role/switch-role.command';
import { SwitchRoleInput } from '../commands/switch-role/switch-role.input';
import { UpdateProfileCommand } from '../commands/update-profile/update-profile.command';
import { UpdateProfileInput } from '../commands/update-profile/update-profile.input';
import { UpdatePasswordCommand } from '../commands/update-password/update-password.command';
import { UpdatePasswordInput } from '../commands/update-password/update-password.input';
import { GetMeQuery } from '../queries/get-me/get-me.query';
import { PaginateMyExperiencePointsQuery } from '../queries/paginate-my-experience-points/paginate-my-experience-points.query';
import { PaginateMyExperiencePointsInput } from '../queries/paginate-my-experience-points/paginate-my-experience-points.input';
import { PaginateMyPointsQuery } from '../queries/paginate-my-points/paginate-my-points.query';
import { PaginateMyPointsInput } from '../queries/paginate-my-points/paginate-my-points.input';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async loginByPassword(@Body() payload: LoginInput) {
    const output = await this.commandBus.execute(new LoginCommand(payload));
    return wrapper.response({
      data: output,
      message: 'Login By Password successfully',
    });
  }

  @Post('switch-role')
  @HttpCode(HttpStatus.OK)
  async switchRole(
    @Request() request: TRequestUser,
    @Body() payload: SwitchRoleInput,
  ) {
    const output = await this.commandBus.execute(
      new SwitchRoleCommand(payload.roleKey, request.user),
    );
    return wrapper.response({
      data: output,
      message: 'Role switched successfully',
    });
  }

  @Get('me')
  async loginByToken(@Request() request: TRequestUser) {
    const output = await this.queryBus.execute(new GetMeQuery(request.token));
    return wrapper.response({
      data: output,
      message: 'Login By Token successfully',
    });
  }

  @Get('me/experience-points')
  async paginateExperiencePoints(
    @Request() request: TRequestUser,
    @Query() query: PaginateMyExperiencePointsInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateMyExperiencePointsQuery(request.user.id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Experience points retrieved successfully',
    });
  }

  @Get('me/points')
  async paginatePoints(
    @Request() request: TRequestUser,
    @Query() query: PaginateMyPointsInput,
  ) {
    const output = await this.queryBus.execute(
      new PaginateMyPointsQuery(request.user.id, query),
    );
    return wrapper.paginationResponse({
      data: output.data,
      count: output.count,
      query,
      message: 'Points retrieved successfully',
    });
  }

  @Patch('profile')
  async updateProfile(
    @Request() request: TRequestUser,
    @Body() payload: UpdateProfileInput,
  ) {
    await this.commandBus.execute(
      new UpdateProfileCommand(payload, request.user),
    );
    return wrapper.response({
      message: 'Profile updated successfully',
    });
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Request() request: TRequestUser,
    @Body() payload: UpdatePasswordInput,
  ) {
    await this.commandBus.execute(
      new UpdatePasswordCommand(payload, request.user),
    );
    return wrapper.response({
      message: 'Password updated successfully',
    });
  }
}
