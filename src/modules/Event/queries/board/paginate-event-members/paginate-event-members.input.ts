import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { EventMember } from '@entities/main/event/event-member.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { getAllEntityProperties } from '@shared/utils/common';

export class PaginateEventMembersInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(
    getAllEntityProperties(EventMember)
      .filter((prop) => prop !== 'status')
      .map((prop) => snakeCase(prop)),
  )
  sortBy: string = 'updated_at';

  @IsOptional()
  @Transform(({ value }) => `${value}`.toLowerCase())
  @IsEnum(OrderKeyEnum)
  order?: OrderKeyEnum = OrderKeyEnum.ASC;
}
