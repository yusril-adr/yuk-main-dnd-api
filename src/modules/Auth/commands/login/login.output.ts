import { User } from '@entities/main/iam/user.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export class LoginOutput extends UserEntityDto {
  selectedRole: RoleEntityDto | null;
  accessToken: string;
  accessTokenExpiredAt: string;

  constructor(payload: {
    user: User;
    selectedRole: string | null;
    accessToken: string;
    accessTokenExpiredAt: string;
    avatarUrl?: string;
  }) {
    super();
    this.parseEntity(payload.user);
    this.selectedRole = payload.selectedRole
      ? (this.roles?.find((role) => role.key === payload.selectedRole) ?? null)
      : null;
    this.accessToken = payload.accessToken;
    this.accessTokenExpiredAt = payload.accessTokenExpiredAt;
    this.avatarUrl = payload.avatarUrl;
  }

  static from(payload: {
    user: User;
    selectedRole: string | null;
    accessToken: string;
    accessTokenExpiredAt: string;
    avatarUrl?: string;
  }): LoginOutput {
    return new LoginOutput(payload);
  }
}