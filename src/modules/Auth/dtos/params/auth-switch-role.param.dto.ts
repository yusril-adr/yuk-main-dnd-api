import { IsDefined, IsString } from 'class-validator';

export class AuthSwitchRoleParamDto {
  @IsString()
  @IsDefined()
  roleKey: string;
}
