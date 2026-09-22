import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { OrderKeyEnum } from '@shared/enums/order.enum';

export class PaginateParamDto {
  @IsOptional()
  @IsString()
  search?: string; // Optional: Search parameter

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1; // Default to page 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 10; // Default to 10 items per page

  @IsOptional()
  @IsString()
  sortBy?: string; // Optional: Sort parameter

  @IsOptional()
  @Transform(({ value }) => `${value}`.toLowerCase())
  @IsEnum(OrderKeyEnum)
  order?: OrderKeyEnum = OrderKeyEnum.DESC; // Optional: Sort parameter
}
