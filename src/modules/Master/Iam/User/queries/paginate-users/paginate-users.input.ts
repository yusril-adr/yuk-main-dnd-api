import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/iam/user.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';

export class PaginateUsersInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(User).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length > 0) return value.split(',');
    return undefined;
  })
  roleIds?: string[];
}