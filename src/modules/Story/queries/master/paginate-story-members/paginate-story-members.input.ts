import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { getAllEntityProperties } from '@shared/utils/common';
import { StoryMemberStatusEnum } from '../../../enums/story-member-status.enum';

export class PaginateStoryMembersInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(
    getAllEntityProperties(StoryMember)
      .filter((prop) => prop !== 'status')
      .map((prop) => snakeCase(prop)),
  )
  sortBy: string = 'updated_at';

  @IsOptional()
  @Transform(({ value }) => `${value}`.toLowerCase())
  @IsEnum(OrderKeyEnum)
  order?: OrderKeyEnum = OrderKeyEnum.ASC;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(StoryMemberStatusEnum)
  status?: StoryMemberStatusEnum;
}
