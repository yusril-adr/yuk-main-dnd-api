import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';
import {
  PUBLIC_EVENT_STATUSES,
  EventStatusEnum,
} from '../../enums/event-status.enum';
import { EventLocationTypeEnum } from '../../enums/event-location-type.enum';

export class PaginateUserJoinedEventsInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(Event).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at';

  @IsOptional()
  @Type(() => Number)
  @IsIn(PUBLIC_EVENT_STATUSES)
  status?: EventStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventLocationTypeEnum)
  locationType?: EventLocationTypeEnum;
}
