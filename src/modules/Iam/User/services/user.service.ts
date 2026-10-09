import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserRepository } from '../repositories/user.repository';
import { User } from '@entities/main/iam/user.entity';
import { Role } from '@entities/main/iam/role.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { File } from '@entities/main/file.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserAvatarPathService } from '@modules/Global/services/user-avatar-path.service';

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

  async assignRoles(
    manager: EntityManager,
    user: User,
    roleIds: string[],
  ): Promise<void> {
    const roleRepository = manager.getRepository(Role);
    const userRoleRepository = manager.getRepository(UserRole);

    const roles = await roleRepository.find({
      where: roleIds.map((id) => ({ id })),
    });

    const foundIds = new Set(roles.map((role) => role.id));
    const missingIds = roleIds.filter((id) => !foundIds.has(id));
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

  generateUserId(): string {
    return randomUUID();
  }
}
