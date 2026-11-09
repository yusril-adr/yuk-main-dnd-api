import { QueryFailedError } from 'typeorm';

export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    typeof error.driverError === 'object' &&
    error.driverError !== null &&
    'code' in error.driverError &&
    (error.driverError as { code?: string }).code === '23505'
  );
}
