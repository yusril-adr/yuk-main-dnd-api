import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  PUBLIC_STORY_STATUSES,
  StoryStatusEnum,
} from '../../enums/story-status.enum';
import { StoryTypeEnum } from '../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../enums/story-location-type.enum';

export class PaginateStoriesInput {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsIn(PUBLIC_STORY_STATUSES)
  status?: StoryStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(StoryTypeEnum)
  type?: StoryTypeEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(StoryLocationTypeEnum)
  locationType?: StoryLocationTypeEnum;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
