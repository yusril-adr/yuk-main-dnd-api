import { IsDefined, IsString } from 'class-validator';

export class AuthLoginPasswordParamDto {
  @IsString()
  @IsDefined()
  identifier: string;

  @IsString()
  @IsDefined()
  password: string;
}
