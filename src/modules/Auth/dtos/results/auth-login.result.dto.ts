import { UserEntityDto } from '@modules/Master/Iam/User/dtos/results/user-entity.result.dto';
import type { TUserEntityDto } from '@modules/Master/Iam/User/dtos/results/user-entity.result.dto';

export type TAuthLoginPasswordResultDto = TUserEntityDto & {
  accessToken: string;
  accessTokenExpiredAt: string;
};

export class AuthLoginPasswordResultDto extends UserEntityDto {
  accessToken: string;
  accessTokenExpiredAt: string;

  constructor(payload: TAuthLoginPasswordResultDto) {
    super();
    this.parseEntity(payload);
    this.accessToken = payload.accessToken;
    this.accessTokenExpiredAt = payload.accessTokenExpiredAt;
  }
}
