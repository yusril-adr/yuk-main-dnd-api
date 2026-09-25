import * as bcrypt from 'bcrypt';
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
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { UserRepository } from './user.repository';
import { UserPaginateParamDto } from './dtos/params/user-paginate.param.dto';
import { UserCreateParamDto } from './dtos/params/user-create.param.dto';
import { UserUpdateParamDto } from './dtos/params/user-update.param.dto';
import { UserEntityDto } from './dtos/results/user-entity.result.dto';
import { mergeWhereConditions } from '@shared/utils/common';
import { User } from '@entities/main/iam/user.entity';
import { Role } from '@entities/main/iam/role.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { File } from '@entities/main/file.entity';
import { TJWTPayload } from '@shared/types/jwt-payload.type';
import { StorageService } from '@modules/shared/services/storage.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    payload: UserCreateParamDto,
  ): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const { roleIds, avatarFileId, ...userPayload } = payload;
    const avatarFile = await this.resolveAvatarFile(avatarFileId);

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const userEntity = userRepo.create({
        ...userPayload,
        password: hashedPassword,
        avatarFile,
      });
      const result = await userRepo.save(userEntity);

      if (roleIds?.length) {
        await this.assignRoles(manager, result, roleIds);
      }
    });
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

    const users = await this.userRepository.find({
      ...query,
      relations: { userRoles: { role: true }, avatarFile: true },
      take: queryDto.perPage,
      skip: queryDto.perPage * (queryDto.page - 1),
    });

    const mappedUsers = users
    .map(
      (user) => {
        let avatarUrl: string | undefined = undefined;
        if (user.avatarFile) {
          avatarUrl = this.storageService.getPublicUrlSync(user.avatarFile);
        }
        return new UserEntityDto().parseEntity(user, avatarUrl);
      }
    );
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
    const avatarFile = isAvatarFileProvided
      ? await this.resolveAvatarFile(avatarFileId, id)
      : previousAvatarFile;

    Object.assign(userEntity, userPayload);
    if (isAvatarFileProvided) {
      userEntity.avatarFile = avatarFile;
    }

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const result = await userRepo.save(userEntity);

      if (roleIds !== undefined) {
        await manager.getRepository(UserRole).delete({ user: { id } });
        if (roleIds.length) {
          await this.assignRoles(manager, result, roleIds);
        }
      }
    });

    if (
      isAvatarFileProvided &&
      previousAvatarFile &&
      previousAvatarFile.id !== avatarFile?.id
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
