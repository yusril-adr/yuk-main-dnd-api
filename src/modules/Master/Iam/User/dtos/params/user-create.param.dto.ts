import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { PermissionEnum } from '@shared/enums/permission.enum';

export class UserCreateParamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(PermissionEnum)
  role: PermissionEnum = PermissionEnum.VIEWER;
}
