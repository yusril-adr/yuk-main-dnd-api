import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Permissions } from '@shared/decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    public readonly configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Permissions, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const valid = roles.includes(user.role);

    if (!valid) {
      throw new ForbiddenException(
        'Your role is not allowed to access this endpoint',
      );
    }

    return valid;
  }
}
