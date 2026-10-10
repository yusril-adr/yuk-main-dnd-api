import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { getAllEntityProperties } from '@shared/utils/common';

export class PaginateUserExperiencePointsInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(UserExpLog).map((prop) => snakeCase(prop)))
  sortBy: string = 'created_at';

  @IsOptional()
  @Type(() => Number)
  @IsEnum(UserExpLogTypeEnum)
  type?: UserExpLogTypeEnum;
}
