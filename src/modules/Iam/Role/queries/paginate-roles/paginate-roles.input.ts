import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { Role } from '@entities/main/iam/role.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';

export class PaginateRolesInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(Role).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isShowInPublic?: boolean;
}