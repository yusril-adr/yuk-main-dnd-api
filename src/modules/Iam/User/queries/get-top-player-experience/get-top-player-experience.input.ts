import { Expose, Transform } from 'class-transformer';
import {
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  parseUtcDate,
  resolveTopExperienceDates,
} from '../../utils/top-experience-range';

@ValidatorConstraint({ name: 'playerUtcCalendarDate' })
class PlayerUtcCalendarDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && parseUtcDate(value) !== null;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid date in YYYY-MM-DD`;
  }
}

@ValidatorConstraint({ name: 'playerEndDateOnOrAfterStartDate' })
class PlayerEndDateOnOrAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const startDate = (args.object as GetTopPlayerExperienceInput).startDate;
    if (typeof value !== 'string' || typeof startDate !== 'string') {
      return true;
    }

    const start = parseUtcDate(startDate);
    const end = parseUtcDate(value);
    if (!start || !end) {
      return true;
    }

    return end.getTime() >= start.getTime();
  }

  defaultMessage(): string {
    return 'endDate must be on or after startDate';
  }
}

export class GetTopPlayerExperienceInput {
  @Expose()
  @Transform(({ obj }: { obj: GetTopPlayerExperienceInput }) => {
    return resolveTopExperienceDates(obj.startDate, obj.endDate).startDate;
  })
  @IsString()
  @Validate(PlayerUtcCalendarDateConstraint)
  startDate: string;

  @Expose()
  @Transform(({ obj }: { obj: GetTopPlayerExperienceInput }) => {
    return resolveTopExperienceDates(obj.startDate, obj.endDate).endDate;
  })
  @IsString()
  @Validate(PlayerUtcCalendarDateConstraint)
  @Validate(PlayerEndDateOnOrAfterStartDateConstraint)
  endDate: string;
}
