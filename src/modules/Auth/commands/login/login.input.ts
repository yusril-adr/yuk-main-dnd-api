import { IsDefined, IsString } from 'class-validator';

export class LoginInput {
  @IsString()
  @IsDefined()
  identifier: string;

  @IsString()
  @IsDefined()
  password: string;
}
