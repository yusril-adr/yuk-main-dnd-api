import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CreateUserInput } from '../create-user/create-user.input';

export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['displayName'] as const),
) {
  // May be omitted, but must not be sent as null or empty; redeclared
  // because PartialType would skip validation for null.
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'displayName must not be empty' })
  @MaxLength(100)
  displayName?: string;
}
