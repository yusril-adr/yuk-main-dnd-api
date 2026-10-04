import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserInput {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsOptional()
  @IsUUID('4')
  avatarFileId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}