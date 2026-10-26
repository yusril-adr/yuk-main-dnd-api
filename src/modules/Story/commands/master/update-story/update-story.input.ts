import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CreateStoryInput } from '../create-story/create-story.input';
import { StoryTypeEnum } from '../../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../../enums/story-location-type.enum';

// Required columns may be omitted on update, but must not be sent as null.
const isProvided = (_: unknown, value: unknown) => value !== undefined;

export class UpdateStoryInput extends PartialType(
  OmitType(CreateStoryInput, [
    'title',
    'type',
    'locationType',
    'locationDetail',
    'status',
    'expAwarded',
  ] as const),
) {
  @ValidateIf(isProvided)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title must not be empty' })
  @MaxLength(150)
  title?: string;

  @ValidateIf(isProvided)
  @IsEnum(StoryTypeEnum)
  type?: StoryTypeEnum;

  @ValidateIf(isProvided)
  @IsEnum(StoryLocationTypeEnum)
  locationType?: StoryLocationTypeEnum;

  @ValidateIf(isProvided)
  @IsString()
  @IsNotEmpty()
  locationDetail?: string;

  // Same rule as create (null is stored as 0), without the default;
  // redeclared because PartialType would skip validation for null.
  @ValidateIf(isProvided)
  @Type(() => Number)
  @Transform(({ value }: { value: unknown }) => (value === null ? 0 : value))
  @IsInt()
  @Min(0)
  expAwarded?: number;
}
