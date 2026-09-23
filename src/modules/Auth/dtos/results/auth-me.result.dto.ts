import { UserEntityDto } from '@modules/Master/Iam/User/dtos/results/user-entity.result.dto';
import { User } from '@entities/main/user.entity';

export class AuthMeResultDto extends UserEntityDto {
  selectedRole: string | null;
  permissions: string[];

  constructor(payload: {
    user: User;
    selectedRole: string | null;
    permissions: string[];
  }) {
    super();
    this.parseEntity(payload.user);
    this.selectedRole = payload.selectedRole;
    this.permissions = payload.permissions;
  }
}
