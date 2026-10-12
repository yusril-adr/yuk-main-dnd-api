import { IsOptional, IsString } from 'class-validator';

export class PermissionOptionsInput {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;
}
