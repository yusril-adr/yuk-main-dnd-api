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
import { RolePermissionRepository } from '@modules/Iam/Role/repositories/role-permission.repository';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { User } from '@entities/main/iam/user.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { LoginInput } from '../commands/login/login.input';
import { LoginOutput } from '../commands/login/login.output';
import { GetMeOutput } from '../queries/get-me/get-me.output';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async loginByPassword({
    identifier,
    password,
  }: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
      relations: {
        userRoles: { role: true },
        avatarFile: true,
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
    await this.loadSelectedRolePermissions(user, selectedRole);
    return this.issueAccessToken(user, selectedRole);
  }

  async switchRole(
    roleKey: string,
    currentUser: TJWTPayload,
  ): Promise<LoginOutput> {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: {
        userRoles: { role: true },
        avatarFile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const availableRoles = this.getAvailableRoles(user);
    if (!availableRoles.includes(roleKey)) {
      throw new ForbiddenException('Role is not available for this user');
    }

    await this.loadSelectedRolePermissions(user, roleKey);
    return this.issueAccessToken(user, roleKey);
  }

  async loginByAccessToken(token: string): Promise<GetMeOutput> {
    const decoded = jwt.verify(
      token,
      this.configService.get<string>('ACCESS_TOKEN_KEY') as string,
    ) as TJWTPayload;

    const user = await this.userRepository.findOne({
      where: { id: decoded.id },
      relations: {
        userRoles: { role: true },
        avatarFile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.loadSelectedRolePermissions(user, decoded.selectedRole);
    const permissions = this.getRolePermissions(user, decoded.selectedRole);

    let avatarUrl: string | undefined = undefined;
    if (user.avatarFile) {
      avatarUrl = this.storageService.getPublicUrlSync(user.avatarFile);
    }
    return new GetMeOutput({
      user,
      selectedRole: decoded.selectedRole,
      permissions,
      avatarUrl,
    });
  }

  private getAvailableRoles(user: User): string[] {
    return (user.userRoles ?? [])
      .map((userRole) => userRole.role?.key)
      .filter((key): key is string => Boolean(key));
  }

  private async loadSelectedRolePermissions(
    user: User,
    selectedRole: string | null,
  ): Promise<void> {
    if (!selectedRole) {
      return;
    }

    const selectedUserRole = (user.userRoles ?? []).find(
      (userRole) => userRole.role?.key === selectedRole,
    );
    if (!selectedUserRole?.role) {
      return;
    }

    selectedUserRole.role.rolePermissions =
      await this.rolePermissionRepository.findByRoleId(
        selectedUserRole.role.id,
      );
  }

  private getRolePermissions(
    user: User,
    selectedRole: string | null,
  ): string[] {
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
  ): LoginOutput {
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

    let avatarUrl: string | undefined = undefined;
    if (user.avatarFile) {
      avatarUrl = this.storageService.getPublicUrlSync(user.avatarFile);
    }

    return new LoginOutput({
      user,
      selectedRole,
      accessToken,
      accessTokenExpiredAt,
      avatarUrl,
    });
  }
}
