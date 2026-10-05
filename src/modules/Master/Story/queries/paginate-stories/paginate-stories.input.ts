import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { Story } from '@entities/main/story/story.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';
import { StoryStatusEnum } from '../../enums/story-status.enum';
import { StoryTypeEnum } from '../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../enums/story-location-type.enum';

export class PaginateStoriesInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(Story).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at';

  @IsOptional()
  @IsEnum(StoryStatusEnum)
  status?: StoryStatusEnum;

  @IsOptional()
  @IsEnum(StoryTypeEnum)
  type?: StoryTypeEnum;

  @IsOptional()
  @IsEnum(StoryLocationTypeEnum)
  locationType?: StoryLocationTypeEnum;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
