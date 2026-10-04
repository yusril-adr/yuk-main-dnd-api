import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { GetMeQuery } from '../queries/get-me/get-me.query';

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
}