import { IsDefined, IsString } from 'class-validator';

export class SwitchRoleInput {
  @IsString()
  @IsDefined()
  roleKey: string;
}