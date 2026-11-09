import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { isPostgresUniqueViolation } from '@shared/utils/postgres-error';

/**
 * Partial unique index on active users.email (NULL emails allowed for guests).
 * Soft-deleted rows are excluded so their email can be re-registered.
 */
export const USERS_EMAIL_UNIQUE_INDEX = 'UQ_users_email_active';

/**
 * Expression unique index on LOWER(username) for active users.
 * Soft-deleted rows are excluded so their username can be re-registered.
 */
export const USERS_USERNAME_UNIQUE_INDEX = 'UQ_users_username_active';

/**
 * Partial unique index on active user_roles (user_id, role_id).
 * Added by migration AddUniqueUserRoleIndex1794214755092 for request-dm.
 */
export const USER_ROLES_UNIQUE_INDEX = 'UQ_user_roles_user_role';

/**
 * One-to-one unique constraint on users.avatar_file_id
 * (migration AddAvatarFileColumn1790311336363). Hit when two users race to
 * claim the same avatar file, which would otherwise surface as the email message.
 */
export const USERS_AVATAR_FILE_UNIQUE_CONSTRAINT =
  'UQ_65eb1fa7df7811daaec973798ce';

/**
 * Map a Postgres unique violation (23505) from a user write to a ConflictException.
 *
 * Why: create/update-user transactions also write user_roles, which has its own
 * unique index (UQ_user_roles_user_role, added for request-dm). A race — e.g.
 * Update User vs POST /auth/me/request-dm, or concurrent role writes — raises
 * 23505 on that index. Mapping every 23505 to the email message would mislead,
 * so we map by constraint/index name (and detail column as a fallback).
 *
 * Email and username uniques only cover active (non-soft-deleted) users, matching
 * the app-level checks which ignore soft-deleted rows. Soft-deleted email/username
 * can therefore be reused. Unmapped unique violations return undefined so the
 * caller can rethrow.
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

  if (
    constraint === USERS_USERNAME_UNIQUE_INDEX ||
    /\(username\)=/i.test(detail) ||
    /\(lower\s*\(/i.test(detail)
  ) {
    return new ConflictException('A user with this username already exists');
  }

  if (
    constraint === USERS_AVATAR_FILE_UNIQUE_CONSTRAINT ||
    /\(avatar_file_id\)=/i.test(detail)
  ) {
    return new ConflictException('Avatar file is already used by another user');
  }

  if (constraint === USER_ROLES_UNIQUE_INDEX) {
    return new ConflictException('User already has this role');
  }

  return undefined;
}
