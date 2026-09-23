import { IsOptional, IsString } from 'class-validator';

export class PermissionFilterParamDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;
}
