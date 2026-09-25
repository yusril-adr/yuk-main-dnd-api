import { UserEntityDto } from '@modules/Master/Iam/User/dtos/results/user-entity.result.dto';
import { RoleEntityDto } from '@modules/Master/Iam/Role/dtos/results/role-entity.result.dto';
import { User } from '@entities/main/iam/user.entity';

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
