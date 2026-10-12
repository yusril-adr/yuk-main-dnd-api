import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { OrderKeyEnum } from '@shared/enums/order.enum';

export class PaginateUserOptionsInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(['display_name', 'username'])
  sortBy: string = 'display_name';

  @IsOptional()
  @Transform(({ value }) => `${value}`.toLowerCase())
  @IsEnum(OrderKeyEnum)
  order?: OrderKeyEnum = OrderKeyEnum.ASC;
}
