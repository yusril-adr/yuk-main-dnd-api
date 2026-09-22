import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import * as wrapper from '@shared/utils/wrapper';
import { AuthService } from '@modules/Auth/auth.service';
import { Public } from '@shared/decorators/public.decorator';
import { AuthLoginPasswordParamDto } from '@modules/Auth/dtos/params/auth-login.param.dto';
import type { TRequestUser } from '@shared/types/request.type';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async loginByPassword(@Body() payload: AuthLoginPasswordParamDto) {
    const result = await this.authService.loginByPassword(payload);
    return wrapper.response({
      data: result,
      message: 'Login By Password successfully',
    });
  }

  @Get('me')
  async loginByToken(@Request() request: TRequestUser) {
    const result = await this.authService.loginByAccessToken(request.token);
    return wrapper.response({
      data: result,
      message: 'Login By Token successfully',
    });
  }
}
