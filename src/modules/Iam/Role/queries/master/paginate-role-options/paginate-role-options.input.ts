import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { OrderKeyEnum } from '@shared/enums/order.enum';

export class PaginateRoleOptionsInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(['name'])
  sortBy: string = 'name';

  @IsOptional()
  @Transform(({ value }) => `${value}`.toLowerCase())
  @IsEnum(OrderKeyEnum)
  order?: OrderKeyEnum = OrderKeyEnum.ASC;
}
