import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Match } from '@shared/decorators/match.decorator';

export class UpdatePasswordInput {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsStrongPassword()
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Match('newPassword')
  newPasswordConfirmation: string;
}