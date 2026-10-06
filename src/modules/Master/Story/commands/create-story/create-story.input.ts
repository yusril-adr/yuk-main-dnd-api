import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { StoryStatusEnum } from '../../enums/story-status.enum';
import { StoryTypeEnum } from '../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../enums/story-location-type.enum';

export class CreateStoryInput {
  @IsString()
  @IsNotEmpty()
  @Matches(/[A-Za-z0-9]/, {
    message: 'title must contain at least one letter or number',
  })
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(StoryStatusEnum)
  status?: StoryStatusEnum;

  @IsEnum(StoryTypeEnum)
  type: StoryTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gameSystem?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expAwarded?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointAwarded?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxMembers?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsEnum(StoryLocationTypeEnum)
  locationType: StoryLocationTypeEnum;

  @IsString()
  @IsNotEmpty()
  locationDetail: string;

  @IsOptional()
  @IsUUID('4')
  bannerFileId?: string | null;
}
