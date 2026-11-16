import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  EventStatusEnum,
  PUBLIC_EVENT_STATUSES,
} from '@modules/Event/enums/event-status.enum';
import { PUBLIC_STORY_STATUSES } from '@modules/Story/enums/story-status.enum';
import { MAX_SCHEDULE_RANGE_DAYS } from '../../constants/schedule.constant';
import {
  SCHEDULE_ITEM_TYPES,
  ScheduleItemTypeEnum,
} from '../../enums/schedule-item-type.enum';

const MAX_SCHEDULE_RANGE_MS = MAX_SCHEDULE_RANGE_DAYS * 24 * 60 * 60 * 1000;

function parseInstant(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

@ValidatorConstraint({ name: 'scheduleEndAfterStart' })
class ScheduleEndAfterStartConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const start = parseInstant((args.object as ListSchedulesInput).start);
    const end = parseInstant(value);
    if (!start || !end) {
      return true;
    }
    return end.getTime() > start.getTime();
  }

  defaultMessage(): string {
    return 'end must be after start';
  }
}

@ValidatorConstraint({ name: 'scheduleMaxRange' })
class ScheduleMaxRangeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const start = parseInstant((args.object as ListSchedulesInput).start);
    const end = parseInstant(value);
    if (!start || !end || end.getTime() <= start.getTime()) {
      return true;
    }
    return end.getTime() - start.getTime() <= MAX_SCHEDULE_RANGE_MS;
  }

  defaultMessage(): string {
    return `The date range must be at most ${MAX_SCHEDULE_RANGE_DAYS} days`;
  }
}

const PUBLIC_SCHEDULE_STATUSES = Array.from(
  new Set([...PUBLIC_STORY_STATUSES, ...PUBLIC_EVENT_STATUSES]),
);

export class ListSchedulesInput {
  @IsDateString()
  start: string;

  @IsDateString()
  @Validate(ScheduleEndAfterStartConstraint)
  @Validate(ScheduleMaxRangeConstraint)
  end: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(SCHEDULE_ITEM_TYPES, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',');
    }
    return undefined;
  })
  type?: ScheduleItemTypeEnum[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(PUBLIC_SCHEDULE_STATUSES)
  status?: EventStatusEnum;
}
