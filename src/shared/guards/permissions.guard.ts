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
export class PermissionsGuard implements CanActivate {
  constructor(
    public readonly configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get(Permissions, context.getHandler());
    if (!permissions) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const valid = permissions.some((permission) =>
      user.permissions?.includes(permission),
    );

    if (!valid) {
      throw new ForbiddenException(
        'Your permission is not allowed to access this endpoint',
      );
    }

    return valid;
  }
}
