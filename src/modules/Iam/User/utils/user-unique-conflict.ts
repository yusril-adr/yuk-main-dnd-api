import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { isPostgresUniqueViolation } from '@shared/utils/postgres-error';

/** Partial unique index on users.email (NULL emails allowed for guests). */
export const USERS_EMAIL_UNIQUE_INDEX = 'UQ_users_email_not_null';

/**
 * Partial unique index on active user_roles (user_id, role_id).
 * Added by migration AddUniqueUserRoleIndex1794214755092 for request-dm.
 */
export const USER_ROLES_UNIQUE_INDEX = 'UQ_user_roles_user_role';

/**
 * Map a Postgres unique violation (23505) from a user write to a ConflictException.
 *
 * Why: create/update-user transactions also write user_roles, which has its own
 * unique index (UQ_user_roles_user_role, added for request-dm). A race — e.g.
 * Update User vs POST /auth/me/request-dm, or concurrent role writes — raises
 * 23505 on that index. Mapping every 23505 to the email message would mislead,
 * so we map by constraint/index name (and detail column as a fallback).
 *
 * Username has no DB unique index today (app-level check only); the detail
 * fallback still covers a future index or a Key (username)=... detail.
 * Unmapped unique violations return undefined so the caller can rethrow.
 */
export function conflictFromUserUniqueViolation(
  error: unknown,
): ConflictException | undefined {
  if (!isPostgresUniqueViolation(error)) {
    return undefined;
  }

  const driverError = (error as QueryFailedError).driverError as {
    constraint?: string | null;
    detail?: string | null;
  };
  const constraint = driverError.constraint ?? undefined;
  const detail = driverError.detail ?? '';

  if (constraint === USERS_EMAIL_UNIQUE_INDEX || /\(email\)=/i.test(detail)) {
    return new ConflictException('A user with this email already exists');
  }

  if (/\(username\)=/i.test(detail)) {
    return new ConflictException('A user with this username already exists');
  }

  if (constraint === USER_ROLES_UNIQUE_INDEX) {
    return new ConflictException('User already has this role');
  }

  return undefined;
}
