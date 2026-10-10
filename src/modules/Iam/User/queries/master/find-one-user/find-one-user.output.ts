import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export class FindOneUserOutput extends UserEntityDto {
  constructor(payload: TUser, avatarUrl?: string) {
    super();
    this.parseEntity(payload, avatarUrl);
  }
}
