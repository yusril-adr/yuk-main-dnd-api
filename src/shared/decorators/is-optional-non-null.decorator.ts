import { ValidateIf, ValidationOptions } from 'class-validator';

/**
 * Like @IsOptional(), but only skips validation when the property is
 * omitted (undefined). null still runs the other validators, so it fails
 * on non-nullable fields instead of reaching the database.
 */
export function IsOptionalNonNull(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateIf((_, value) => value !== undefined, validationOptions);
}
