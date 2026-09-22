import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserCreateParamDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  exp?: number;

  @IsOptional()
  @IsInt()
  level?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleKeys?: string[];
}
