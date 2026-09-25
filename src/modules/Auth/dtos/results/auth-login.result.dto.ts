import { UserEntityDto } from '@modules/Master/Iam/User/dtos/results/user-entity.result.dto';
import { RoleEntityDto } from '@modules/Master/Iam/Role/dtos/results/role-entity.result.dto';
import { User } from '@entities/main/iam/user.entity';

export class AuthLoginResultDto extends UserEntityDto {
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
}
