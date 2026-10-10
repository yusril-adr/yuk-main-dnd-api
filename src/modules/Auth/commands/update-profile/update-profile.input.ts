import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileInput {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID('4')
  avatarFileId?: string | null;
}
