import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigEnum } from '@shared/enums/config.enum';

@Injectable()
export class DeprecatedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isDeprecated = this.reflector.get<boolean>(
      ConfigEnum.DEPRECATED_KEY,
      context.getHandler(),
    );

    if (isDeprecated) {
      throw new ForbiddenException('This endpoint is deprecated.');
    }

    return true;
  }
}
