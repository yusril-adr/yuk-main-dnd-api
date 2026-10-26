import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsOptionalNonNull } from '@shared/decorators/is-optional-non-null.decorator';

export class UpdateProfileInput {
  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'displayName must not be empty' })
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\S*$/, {
    message: 'username must not contain spaces',
  })
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bio?: string;

  @IsOptionalNonNull()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID('4')
  avatarFileId?: string | null;
}
