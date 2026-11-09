import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { snakeCase } from 'typeorm/util/StringUtils';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { getAllEntityProperties } from '@shared/utils/common';
import { EventStatusEnum } from '../../../enums/event-status.enum';
import { EventLocationTypeEnum } from '../../../enums/event-location-type.enum';

export class PaginateEventsInput extends PaginateParamDto {
  @IsOptional()
  @IsString()
  @IsIn(getAllEntityProperties(Event).map((prop) => snakeCase(prop)))
  sortBy: string = 'updated_at';

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventStatusEnum)
  status?: EventStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventLocationTypeEnum)
  locationType?: EventLocationTypeEnum;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
