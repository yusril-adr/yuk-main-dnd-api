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
import { IsOptionalNonNull } from '@shared/decorators/is-optional-non-null.decorator';

// Written out instead of PartialType(CreateUserInput): PartialType adds
// @IsOptional(), which would let null through to non-nullable columns.
export class UpdateUserInput {
  @IsOptional()
  @IsString()
  @Matches(/^\S*$/, {
    message: 'username must not contain spaces',
  })
  @MaxLength(50)
  username?: string;

  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptionalNonNull()
  @IsStrongPassword()
  password?: string;

  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'displayName must not be empty' })
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsUUID('4')
  avatarFileId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bio?: string;

  @IsOptionalNonNull()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}
