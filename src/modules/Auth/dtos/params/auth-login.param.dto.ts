import { PermissionEnum } from '@shared/enums/permission.enum';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AuthLoginPasswordParamDto {
  @IsString()
  @IsEmail()
  @IsDefined()
  email: string;

  @IsString()
  @IsDefined()
  password: string;

  @IsString()
  @IsEnum(PermissionEnum)
  @IsOptional()
  role: PermissionEnum | null = null;

  // @IsDefined()
  // @IsNotEmptyObject()
  // @ValidateNested()
  // @Type(() => B)
  // a: B;
}
