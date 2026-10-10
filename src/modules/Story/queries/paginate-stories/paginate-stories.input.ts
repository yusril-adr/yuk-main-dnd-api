import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { Story } from '@entities/main/story/story.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';
import {
  PUBLIC_STORY_STATUSES,
  StoryStatusEnum,
} from '../../enums/story-status.enum';
import { StoryTypeEnum } from '../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../enums/story-location-type.enum';

export class PaginateStoriesInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(Story).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at';

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
