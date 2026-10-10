import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';

export class AddUserPointsInput {
  @Type(() => Number)
  @IsEnum(UserPointLogTypeEnum)
  type: UserPointLogTypeEnum;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
