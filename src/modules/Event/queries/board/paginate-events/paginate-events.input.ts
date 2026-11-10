import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { EventStatusEnum } from '../../../enums/event-status.enum';
import { EventLocationTypeEnum } from '../../../enums/event-location-type.enum';
import { EventMemberStatusEnum } from '../../../enums/event-member-status.enum';

export class PaginateEventsInput {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventStatusEnum)
  status?: EventStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventMemberStatusEnum)
  memberStatus?: EventMemberStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventLocationTypeEnum)
  locationType?: EventLocationTypeEnum;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
