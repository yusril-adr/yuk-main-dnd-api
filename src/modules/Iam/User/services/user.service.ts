import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import {
  EntityManager,
  FindOneOptions,
  QueryFailedError,
  Raw,
  Repository,
} from 'typeorm';
import { UserRepository } from '../repositories/user.repository';
import { User } from '@entities/main/iam/user.entity';
import { Role } from '@entities/main/iam/role.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { File } from '@entities/main/file.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserAvatarPathService } from '@modules/Global/services/user-avatar-path.service';
import { isPostgresUniqueViolation } from '@shared/utils/postgres-error';

/** Partial unique index on users.email (NULL emails allowed for guests). */
const USERS_EMAIL_UNIQUE_INDEX = 'UQ_users_email_not_null';

/**
 * Partial unique index on active user_roles (user_id, role_id).
 * Added by migration AddUniqueUserRoleIndex1794214755092 for request-dm.
 */
const USER_ROLES_UNIQUE_INDEX = 'UQ_user_roles_user_role';

/**
 * One-to-one unique constraint on users.avatar_file_id
 * (migration AddAvatarFileColumn1790311336363). Hit when two users race to
 * claim the same avatar file, which would otherwise surface as the email message.
 */
const USERS_AVATAR_FILE_UNIQUE_CONSTRAINT = 'UQ_65eb1fa7df7811daaec973798ce';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
    private readonly userAvatarPathService: UserAvatarPathService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async checkEmailUniqueness(
    email: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email },
    });
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException('Email already exists');
    }
  }

  async checkUsernameUniqueness(
    username: string | null | undefined,
    excludeUserId?: string,
  ): Promise<void> {
    const normalizedUsername = username?.trim();
    if (!normalizedUsername) {
      return;
    }

    const existing = await this.userRepository.findOne({
      where: {
        username: Raw((alias) => `LOWER(${alias}) = LOWER(:username)`, {
          username: normalizedUsername,
        }),
      },
    });
    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException('A user with this username already exists');
    }
  }

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
  conflictFromUniqueViolation(error: unknown): ConflictException | undefined {
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

    if (
      constraint === USERS_AVATAR_FILE_UNIQUE_CONSTRAINT ||
      /\(avatar_file_id\)=/i.test(detail)
    ) {
      return new ConflictException(
        'Avatar file is already used by another user',
      );
    }

    if (constraint === USER_ROLES_UNIQUE_INDEX) {
      return new ConflictException('User already has this role');
    }

    return undefined;
  }

  async assignRoles(
    manager: EntityManager,
    user: User,
    roleIds: string[],
  ): Promise<void> {
    const roleRepository = manager.getRepository(Role);
    const userRoleRepository = manager.getRepository(UserRole);

    // Deduplicate so create/update with repeated role_ids cannot insert twice.
    const uniqueRoleIds = [...new Set(roleIds)];

    const roles = await roleRepository.find({
      where: uniqueRoleIds.map((id) => ({ id })),
    });

    const foundIds = new Set(roles.map((role) => role.id));
    const missingIds = uniqueRoleIds.filter((id) => !foundIds.has(id));
    if (missingIds.length) {
      throw new NotFoundException(
        `Role with id ${missingIds.join(', ')} not found`,
      );
    }

    await userRoleRepository.save(
      roles.map((role) => userRoleRepository.create({ user, role })),
    );
  }

  async resolveAvatarFile(
    avatarFileId: string | null | undefined,
    expectedStatus: FileStatusEnum,
    userId?: string,
  ): Promise<File | null> {
    if (avatarFileId === null || avatarFileId === undefined) {
      return null;
    }

    const file = await this.fileRepository.findOne({
      where: { id: avatarFileId },
    });
    if (!file) {
      throw new NotFoundException(`File with id ${avatarFileId} not found`);
    }

    if (file.status !== expectedStatus) {
      throw new ConflictException(
        `File with id ${avatarFileId} must be ${expectedStatus}`,
      );
    }

    const fileUser = await this.userRepository.findOne({
      where: { avatarFile: { id: avatarFileId } },
    });
    if (fileUser && fileUser.id !== userId) {
      throw new ConflictException(
        `File with id ${avatarFileId} is already assigned to another user`,
      );
    }

    return file;
  }

  getAvatarPromotionDestination(
    file: File,
    userId: string,
  ): { bucket: string; path: string } {
    const bucket = this.userAvatarPathService.getBucket();
    if (
      file.bucket !== bucket ||
      !this.userAvatarPathService.isTemporaryPath(file.path)
    ) {
      throw new ConflictException(
        `File with id ${file.id} is not a temporary user avatar`,
      );
    }

    return {
      bucket,
      path: this.userAvatarPathService.createPromotedPath(userId, file.path),
    };
  }

  async moveAvatarFile(
    file: File,
    destination: { bucket: string; path: string },
  ): Promise<File> {
    const movedStorageFile = await this.storageService.move(file, destination);

    return this.fileRepository.create({
      ...file,
      bucket: movedStorageFile.bucket,
      path: movedStorageFile.path,
      driver: movedStorageFile.driver,
      status: FileStatusEnum.ACTIVE,
    });
  }

  async restoreTemporaryAvatarFile(
    movedFile: File,
    temporaryFile: File,
  ): Promise<void> {
    try {
      await this.storageService.move(movedFile, {
        bucket: temporaryFile.bucket,
        path: temporaryFile.path,
      });
    } catch (error) {
      this.logger.error(
        `Failed to restore temporary avatar file ${temporaryFile.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async cleanupAvatarFile(file: File): Promise<void> {
    try {
      await this.storageService.delete(file);
      await this.fileRepository.softDelete(file.id);
    } catch (error) {
      this.logger.error(
        `Failed to clean up avatar file ${file.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async resolveAvatarUrl(user: User): Promise<string | undefined> {
    if (user.avatarFile) {
      return this.storageService.getPublicUrlSync(user.avatarFile);
    }
    return undefined;
  }

  // Loads userRoles for public reads. A where on the user query would join
  // user_roles into findAndCount and count role rows instead of users.
  async attachPublicRoles(users: User[]): Promise<void> {
    if (users.length === 0) {
      return;
    }

    const userRoles = await this.userRepository.manager
      .getRepository(UserRole)
      .createQueryBuilder('userRole')
      .innerJoinAndSelect(
        'userRole.role',
        'role',
        'role.isShowInPublic = :isShowInPublic',
        { isShowInPublic: true },
      )
      .innerJoin('userRole.user', 'owner')
      .addSelect('owner.id')
      .where('owner.id IN (:...userIds)', {
        userIds: users.map((user) => user.id),
      })
      .getMany();

    const rolesByUserId = new Map<string, UserRole[]>();
    for (const userRole of userRoles) {
      const userId = userRole.user?.id;
      if (!userId) {
        continue;
      }
      const roles = rolesByUserId.get(userId);
      if (roles) {
        roles.push(userRole);
      } else {
        rolesByUserId.set(userId, [userRole]);
      }
    }

    for (const user of users) {
      user.userRoles = rolesByUserId.get(user.id) ?? [];
    }
  }

  async findPublicByIdentifier(
    identifier: string,
    options?: Pick<FindOneOptions<User>, 'relations'>,
  ): Promise<User> {
    if (isUUID(identifier)) {
      const userById = await this.userRepository.findOne({
        where: { id: identifier },
        relations: options?.relations,
      });
      if (userById) {
        return userById;
      }
    }

    const userByUsername = await this.userRepository.findOne({
      where: {
        username: Raw((alias) => `LOWER(${alias}) = LOWER(:username)`, {
          username: identifier.trim(),
        }),
      },
      relations: options?.relations,
    });
    if (!userByUsername) {
      throw new NotFoundException(
        `User with identifier ${identifier} not found`,
      );
    }

    return userByUsername;
  }

  generateUserId(): string {
    return randomUUID();
  }
}
