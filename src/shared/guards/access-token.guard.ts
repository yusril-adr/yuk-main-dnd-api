import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { ConfigEnum } from '@shared/enums/config.enum';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    public readonly configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.get<boolean>(
      ConfigEnum.IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true; // ✅ Skip authentication
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const secret = this.configService.get<string>(
        'ACCESS_TOKEN_KEY',
      ) as string;
      const payload = jwt.verify(token, secret);
      request['user'] = payload;
      request['token'] = token;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
