import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TJWTPayload } from '@shared/types/jwt-payload.type';
import dayjs from '@shared/utils/dayjs';
import { AuthLoginPasswordParamDto } from '@modules/Auth/dtos/params/auth-login.param.dto';
import { AuthLoginResultDto } from '@modules/Auth/dtos/results/auth-login.result.dto';
import { AuthMeResultDto } from '@modules/Auth/dtos/results/auth-me.result.dto';
import { UserRepository } from '@modules/Master/Iam/User/user.repository';
import { User } from '@entities/main/iam/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async loginByPassword({
    identifier,
    password,
  }: AuthLoginPasswordParamDto): Promise<AuthLoginResultDto> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Email, username or password is incorrect',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Email, username or password is incorrect',
      );
    }

    const availableRoles = this.getAvailableRoles(user);
    if (!availableRoles.length) {
      throw new ForbiddenException('User has no roles assigned');
    }

    const selectedRole = availableRoles.length === 1 ? availableRoles[0] : null;
    return this.issueAccessToken(user, selectedRole);
  }

  async switchRole(
    roleKey: string,
    currentUser: TJWTPayload,
  ): Promise<AuthLoginResultDto> {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const availableRoles = this.getAvailableRoles(user);
    if (!availableRoles.includes(roleKey)) {
      throw new ForbiddenException('Role is not available for this user');
    }

    return this.issueAccessToken(user, roleKey);
  }

  async loginByAccessToken(token: string): Promise<AuthMeResultDto> {
    const decoded = jwt.verify(
      token,
      this.configService.get<string>('ACCESS_TOKEN_KEY') as string,
    ) as TJWTPayload;

    const user = await this.userRepository.findOne({
      where: { id: decoded.id },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const permissions = this.getRolePermissions(user, decoded.selectedRole);
    return new AuthMeResultDto({
      user,
      selectedRole: decoded.selectedRole,
      permissions,
    });
  }

  private getAvailableRoles(user: User): string[] {
    return (user.userRoles ?? [])
      .map((userRole) => userRole.role?.key)
      .filter((key): key is string => Boolean(key));
  }

  private getRolePermissions(user: User, selectedRole: string | null): string[] {
    const selectedUserRole = selectedRole
      ? (user.userRoles ?? []).find(
          (userRole) => userRole.role?.key === selectedRole,
        )
      : undefined;

    const permissions = (selectedUserRole?.role?.rolePermissions ?? [])
      .map((rolePermission) => rolePermission.permission?.key)
      .filter((key): key is string => Boolean(key));

    return [...new Set(permissions)];
  }

  private issueAccessToken(
    user: User,
    selectedRole: string | null,
  ): AuthLoginResultDto {
    const payload: TJWTPayload = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      selectedRole,
      availableRoles: this.getAvailableRoles(user),
      permissions: this.getRolePermissions(user, selectedRole),
    };

    const accessExpiresIn = Number(
      this.configService.get('ACCESS_EXPIRES_IN_SECONDS') ?? 86400,
    );
    const accessToken = jwt.sign(
      payload,
      this.configService.get<string>('ACCESS_TOKEN_KEY') as string,
      { expiresIn: accessExpiresIn },
    );
    const accessTokenExpiredAt = dayjs()
      .add(accessExpiresIn, 'second')
      .toISOString();

    return new AuthLoginResultDto({
      user,
      selectedRole,
      accessToken,
      accessTokenExpiredAt,
    });
  }
}
