import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';

export class AddUserExperiencePointsInput {
  @Type(() => Number)
  @IsEnum(UserExpLogTypeEnum)
  type: UserExpLogTypeEnum;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
