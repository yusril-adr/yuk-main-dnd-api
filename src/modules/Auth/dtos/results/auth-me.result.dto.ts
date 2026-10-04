import { User } from '@entities/main/iam/user.entity';
import { RoleEntityDto } from '@shared/dtos/entities/iam/role.entity.dto';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export class AuthMeResultDto extends UserEntityDto {
  selectedRole: RoleEntityDto | null;
  permissions: string[];

  constructor(payload: {
    user: User;
    selectedRole: string | null;
    permissions: string[];
    avatarUrl?: string;
  }) {
    super();
    this.parseEntity(payload.user);
    this.selectedRole = payload.selectedRole
      ? (this.roles?.find((role) => role.key === payload.selectedRole) ?? null)
      : null;
    this.permissions = payload.permissions;
    this.avatarUrl = payload.avatarUrl;
  }
}
