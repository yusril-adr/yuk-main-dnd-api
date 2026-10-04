import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserRepository } from './user.repository';
import { UserPaginateParamDto } from './dtos/params/user-paginate.param.dto';
import { UserCreateParamDto } from './dtos/params/user-create.param.dto';
import { UserUpdateParamDto } from './dtos/params/user-update.param.dto';
import { UserEntityDto } from './dtos/results/user-entity.result.dto';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { User } from '@entities/main/iam/user.entity';
import { Role } from '@entities/main/iam/role.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { File } from '@entities/main/file.entity';
import { TJWTPayload } from '@shared/types/jwt-payload.type';
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
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: UserCreateParamDto): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const { roleIds, avatarFileId, ...userPayload } = payload;
    const temporaryAvatarFile = await this.resolveAvatarFile(
      avatarFileId,
      FileStatusEnum.TEMPORARY,
    );
    const userId = temporaryAvatarFile ? randomUUID() : undefined;
    const promotionDestination = temporaryAvatarFile
      ? this.getAvatarPromotionDestination(temporaryAvatarFile, userId!)
      : undefined;
    const movedAvatarFile =
      temporaryAvatarFile && promotionDestination
        ? await this.moveAvatarFile(temporaryAvatarFile, promotionDestination)
        : null;

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const fileRepo = manager.getRepository(File);
        const avatarFile = movedAvatarFile
          ? await fileRepo.save(movedAvatarFile)
          : null;
        const userEntity = userRepo.create({
          ...userPayload,
          ...(userId ? { id: userId } : {}),
          password: hashedPassword,
          avatarFile,
        });
        const result = await userRepo.save(userEntity);

        if (roleIds?.length) {
          await this.assignRoles(manager, result, roleIds);
        }
      });
    } catch (error) {
      if (movedAvatarFile && temporaryAvatarFile) {
        await this.restoreTemporaryAvatarFile(
          movedAvatarFile,
          temporaryAvatarFile,
        );
      }

      throw error;
    }
  }

  async paginate(
    queryDto: UserPaginateParamDto,
  ): Promise<[UserEntityDto[], number]> {
    let query: FindManyOptions<User> = {
      order: {
        [camelCase(queryDto.sortBy)]: queryDto.order,
      },
    };

    query = this.searchQuery(query, queryDto);
    query = await this.filterQuery(query, queryDto);

    const users = await this.userRepository.find({
      ...query,
      relations: { userRoles: { role: true }, avatarFile: true },
      take: queryDto.perPage,
      skip: queryDto.perPage * (queryDto.page - 1),
    });

    const mappedUsers = users.map((user) => {
      let avatarUrl: string | undefined = undefined;
      if (user.avatarFile) {
        avatarUrl = this.storageService.getPublicUrlSync(user.avatarFile);
      }
      return new UserEntityDto().parseEntity(user, avatarUrl);
    });
    const count = await this.userRepository.count(query);
    return [mappedUsers, count];
  }

  private searchQuery(
    query: FindManyOptions<User>,
    queryDto: UserPaginateParamDto,
  ): FindManyOptions<User> {
    if (queryDto.search) {
      const searchCondition: FindOptionsWhere<User>[] = [
        {
          username: ILike(`%${queryDto.search}%`),
        },
        {
          displayName: ILike(`%${queryDto.search}%`),
        },
        {
          email: ILike(`%${queryDto.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private async filterQuery(
    query: FindManyOptions<User>,
    queryDto: UserPaginateParamDto,
  ): Promise<FindManyOptions<User>> {
    if (queryDto.roleIds?.length) {
      const userRoles = await this.userRepository.manager
        .getRepository(UserRole)
        .createQueryBuilder('ur')
        .select('DISTINCT ur.user_id', 'user_id')
        .where('ur.role_id IN (:...roleIds)', { roleIds: queryDto.roleIds })
        .getRawMany();

      const userIds = userRoles.map((ur) => ur.user_id);

      query.where = mergeEachWhereConditions(query.where, {
        id: In(userIds.length ? userIds : ['']),
      });
    }
    return query;
  }

  async findOne(id: string): Promise<UserEntityDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
        avatarFile: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    let avatarUrl: string | undefined = undefined;
    if (user.avatarFile) {
      avatarUrl = this.storageService.getPublicUrlSync(user.avatarFile);
    }
    return new UserEntityDto().parseEntity(user, avatarUrl);
  }

  async update(
    id: string,
    payload: UserUpdateParamDto,
    user: TJWTPayload,
  ): Promise<void> {
    const userEntity = await this.userRepository.findOne({
      where: { id },
      relations: { userRoles: { role: true }, avatarFile: true },
    });
    if (!userEntity) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (payload.email && payload.email !== userEntity.email) {
      const existing = await this.userRepository.findOne({
        where: { email: payload.email },
      });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    const { roleIds, avatarFileId, ...userPayload } = payload;
    const isAvatarFileProvided = avatarFileId !== undefined;
    const previousAvatarFile = userEntity.avatarFile;
    const isCurrentAvatarFile = avatarFileId === previousAvatarFile?.id;
    const temporaryAvatarFile =
      isAvatarFileProvided && avatarFileId !== null && !isCurrentAvatarFile
        ? await this.resolveAvatarFile(
            avatarFileId,
            FileStatusEnum.TEMPORARY,
            id,
          )
        : null;
    const promotionDestination = temporaryAvatarFile
      ? this.getAvatarPromotionDestination(temporaryAvatarFile, id)
      : undefined;
    const movedAvatarFile =
      temporaryAvatarFile && promotionDestination
        ? await this.moveAvatarFile(temporaryAvatarFile, promotionDestination)
        : null;
    const nextAvatarFile = movedAvatarFile
      ? movedAvatarFile
      : isAvatarFileProvided
        ? isCurrentAvatarFile
          ? previousAvatarFile
          : null
        : previousAvatarFile;

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const fileRepo = manager.getRepository(File);
        const avatarFile = movedAvatarFile
          ? await fileRepo.save(movedAvatarFile)
          : nextAvatarFile;

        Object.assign(userEntity, userPayload);
        if (isAvatarFileProvided) {
          userEntity.avatarFile = avatarFile;
        }

        const result = await userRepo.save(userEntity);

        if (roleIds !== undefined) {
          await manager.getRepository(UserRole).delete({ user: { id } });
          if (roleIds.length) {
            await this.assignRoles(manager, result, roleIds);
          }
        }
      });
    } catch (error) {
      if (movedAvatarFile && temporaryAvatarFile) {
        await this.restoreTemporaryAvatarFile(
          movedAvatarFile,
          temporaryAvatarFile,
        );
      }

      throw error;
    }

    if (
      isAvatarFileProvided &&
      previousAvatarFile &&
      previousAvatarFile.id !== nextAvatarFile?.id
    ) {
      await this.cleanupAvatarFile(previousAvatarFile);
    }
  }

  async remove(id: string, user: TJWTPayload): Promise<void> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    if (!userEntity) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      await userRepo.softDelete(id);
    });
  }

  private async assignRoles(
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

  private async resolveAvatarFile(
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

  private getAvatarPromotionDestination(
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

  private async moveAvatarFile(
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

  private async restoreTemporaryAvatarFile(
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

  private async cleanupAvatarFile(file: File): Promise<void> {
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
}
