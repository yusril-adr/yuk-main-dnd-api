import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateGuestUserInput {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S*$/, {
    message: 'username must not contain spaces',
  })
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'displayName must not be empty' })
  @MaxLength(100)
  displayName: string;
}
