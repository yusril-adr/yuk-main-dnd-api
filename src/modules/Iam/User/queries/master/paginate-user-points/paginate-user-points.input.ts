import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';
import { getAllEntityProperties } from '@shared/utils/common';

export class PaginateUserPointsInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(UserPointLog).map((prop) => snakeCase(prop)))
  sortBy: string = 'created_at';

  @IsOptional()
  @Type(() => Number)
  @IsEnum(UserPointLogTypeEnum)
  type?: UserPointLogTypeEnum;
}
