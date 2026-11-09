import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsOptionalNonNull } from '@shared/decorators/is-optional-non-null.decorator';
import { EventLocationTypeEnum } from '../../../enums/event-location-type.enum';

export class UpdateEventInput {
  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title must not be empty' })
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @Transform(({ value }: { value: unknown }) => (value === null ? 0 : value))
  @IsInt()
  @Min(0)
  expAwarded?: number;

  @IsOptionalNonNull()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointAwarded?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxMembers?: number | null;

  @IsOptional()
  @IsDateString()
  startAt?: string | null;

  @IsOptionalNonNull()
  @Type(() => Number)
  @IsEnum(EventLocationTypeEnum)
  locationType?: EventLocationTypeEnum;

  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  locationDetail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'location_link must be an https link' },
  )
  locationLink?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'feedback_form_link must be an https link' },
  )
  feedbackFormLink?: string | null;

  @IsOptional()
  @IsUUID('4')
  bannerFileId?: string | null;
}
