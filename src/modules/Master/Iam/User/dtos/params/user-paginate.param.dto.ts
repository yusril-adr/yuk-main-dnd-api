import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/user.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';
import { UserStatusEnum } from '@shared/enums/user.enum';
import { PermissionEnum } from '@shared/enums/permission.enum';

export class UserPaginateParamDto extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(User).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at'; // Optional: Sort parameter

  @IsOptional()
  @IsString()
  @IsEnum(PermissionEnum)
  role?: PermissionEnum;

  @IsOptional()
  @IsString()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnum;
}
