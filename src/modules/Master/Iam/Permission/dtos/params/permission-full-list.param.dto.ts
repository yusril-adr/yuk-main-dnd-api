import { IsOptional, IsString } from 'class-validator';

export class PermissionFullListParamDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;
}
