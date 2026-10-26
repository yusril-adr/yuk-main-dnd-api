import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsOptionalNonNull } from '@shared/decorators/is-optional-non-null.decorator';

// Written out instead of PartialType(CreateRoleInput): PartialType adds
// @IsOptional(), which would let null through to non-nullable columns.
export class UpdateRoleInput {
  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  @Matches(/[A-Za-z0-9]/, {
    message: 'name must contain at least one letter or number',
  })
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptionalNonNull()
  @IsBoolean()
  isShowInPublic?: boolean;

  @IsOptionalNonNull()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}
