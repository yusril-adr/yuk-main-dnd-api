import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/iam/user.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { getAllEntityProperties } from '@shared/utils/common';

export class GetAvailableStoryUsersInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(User).map((prop) => snakeCase(prop)))
  sortBy: string = 'display_name';

  @IsOptional()
  @Transform(({ value }) => `${value}`.toLowerCase())
  @IsEnum(OrderKeyEnum)
  order?: OrderKeyEnum = OrderKeyEnum.ASC;
}
