import { IsOptional, IsString } from 'class-validator';

export class FindAllPermissionsInput {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;
}