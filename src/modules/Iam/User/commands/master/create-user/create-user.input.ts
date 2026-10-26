import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUserInput {
  @IsOptional()
  @IsString()
  @Matches(/^\S*$/, {
    message: 'username must not contain spaces',
  })
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
  @Matches(/\S/, { message: 'displayName must not be empty' })
  @MaxLength(100)
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
