import type { TUser } from '@entities/main/iam/user.entity';
import { UserEntityDto } from '@shared/dtos/entities/iam/user.entity.dto';

export class FindOneUserOutput {
  constructor(public readonly data: UserEntityDto) {}

  static from(user: TUser, avatarUrl?: string): FindOneUserOutput {
    return new FindOneUserOutput(new UserEntityDto().parseEntity(user, avatarUrl));
  }
}