import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  Equals,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { STORY_PLAYER_EXP_REWARD } from '../../../constants/story-reward.constant';
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
  @Matches(/[A-Za-z0-9]/, {
    message: 'title must contain at least one letter or number',
  })
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

  // Same rule as create; redeclared because PartialType would let null through.
  @ValidateIf(isProvided)
  @Type(() => Number)
  @IsInt()
  @Equals(STORY_PLAYER_EXP_REWARD, {
    message: `exp_awarded must be ${STORY_PLAYER_EXP_REWARD}`,
  })
  expAwarded?: number;
}
