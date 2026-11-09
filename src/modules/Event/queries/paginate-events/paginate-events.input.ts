import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  PUBLIC_EVENT_STATUSES,
  EventStatusEnum,
} from '../../enums/event-status.enum';
import { EventLocationTypeEnum } from '../../enums/event-location-type.enum';

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
  @IsIn(PUBLIC_EVENT_STATUSES)
  status?: EventStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventLocationTypeEnum)
  locationType?: EventLocationTypeEnum;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
