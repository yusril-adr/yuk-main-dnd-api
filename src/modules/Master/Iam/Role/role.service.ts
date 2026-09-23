import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Permission } from '@entities/main/permission.entity';
import { Role } from '@entities/main/role.entity';
import { RolePermission } from '@entities/main/role-permission.entity';
import { mergeWhereConditions } from '@shared/utils/common';
import { RoleCreateParamDto } from './dtos/params/role-create.param.dto';
import { RolePaginateParamDto } from './dtos/params/role-paginate.param.dto';
import { RoleUpdateParamDto } from './dtos/params/role-update.param.dto';
import { RoleEntityDto } from './dtos/results/role-entity.result.dto';
import { RoleRepository } from './role.repository';

const ROLE_KEY_MAX_LENGTH = 50;
const ROLE_KEY_SUFFIX_LENGTH = 6;
const ROLE_KEY_GENERATION_MAX_ATTEMPTS = 10;
const ROLE_KEY_SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: RoleCreateParamDto): Promise<void> {
    const key = await this.generateUniqueKey(payload.name);
    const { permissionIds, ...rolePayload } = payload;
    await this.dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role);
      const role = await roleRepository.save(
        roleRepository.create({ ...rolePayload, key }),
      );

      if (permissionIds?.length) {
        await this.assignPermissions(manager, role, permissionIds);
      }
    });
  }

  async paginate(
    queryDto: RolePaginateParamDto,
  ): Promise<[RoleEntityDto[], number]> {
    let query: FindManyOptions<Role> = {
      order: {
        [camelCase(queryDto.sortBy)]: queryDto.order,
      },
    };

    query = this.searchQuery(query, queryDto);

    const roles = await this.roleRepository.find({
      ...query,
      take: queryDto.perPage,
      skip: queryDto.perPage * (queryDto.page - 1),
    });
    const count = await this.roleRepository.count(query);

    return [roles.map((role) => new RoleEntityDto().parseEntity(role)), count];
  }

  private searchQuery(
    query: FindManyOptions<Role>,
    queryDto: RolePaginateParamDto,
  ): FindManyOptions<Role> {
    if (queryDto.search) {
      const searchCondition: FindOptionsWhere<Role>[] = [
        {
          key: ILike(`%${queryDto.search}%`),
        },
        {
          name: ILike(`%${queryDto.search}%`),
        },
        {
          description: ILike(`%${queryDto.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  async findOne(id: string): Promise<RoleEntityDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }
    return new RoleEntityDto().parseEntity(role);
  }

  async update(
    id: string,
    payload: RoleUpdateParamDto,
  ): Promise<void> {
    const roleEntity = await this.roleRepository.findOne({
      where: { id },
    });
    if (!roleEntity) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    const hasNameChanged =
      payload.name !== undefined && payload.name !== roleEntity.name;
    const { permissionIds, ...rolePayload } = payload;
    Object.assign(roleEntity, rolePayload);

    if (hasNameChanged) {
      roleEntity.key = await this.generateUniqueKey(payload.name as string, id);
    }

    await this.dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role);
      const result = await roleRepository.save(roleEntity);

      if (permissionIds !== undefined) {
        await manager.getRepository(RolePermission).delete({ role: { id } });
        if (permissionIds.length) {
          await this.assignPermissions(manager, result, permissionIds);
        }
      }
    });
  }

  async remove(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Role).softDelete(id);
    });
  }

  private async assignPermissions(
    manager: EntityManager,
    role: Role,
    permissionIds: string[],
  ): Promise<void> {
    const uniquePermissionIds = [...new Set(permissionIds)];
    const permissionRepository = manager.getRepository(Permission);
    const rolePermissionRepository = manager.getRepository(RolePermission);

    const permissions = await permissionRepository.find({
      where: uniquePermissionIds.map((permissionId) => ({ id: permissionId })),
    });

    const foundIds = new Set(permissions.map((permission) => permission.id));
    const missingIds = uniquePermissionIds.filter(
      (permissionId) => !foundIds.has(permissionId),
    );
    if (missingIds.length) {
      throw new NotFoundException(
        `Permission with id ${missingIds.join(', ')} not found`,
      );
    }

    await rolePermissionRepository.save(
      permissions.map((permission) =>
        rolePermissionRepository.create({ role, permission }),
      ),
    );
  }

  private async generateUniqueKey(
    name: string,
    excludedRoleId?: string,
  ): Promise<string> {
    const baseKey = this.slugify(name);
    const existingBaseKey = await this.roleRepository.findOne({
      where: { key: baseKey },
    });

    if (!existingBaseKey || existingBaseKey.id === excludedRoleId) {
      return baseKey;
    }

    const maxBaseLength = ROLE_KEY_MAX_LENGTH - ROLE_KEY_SUFFIX_LENGTH - 1;

    for (
      let attempt = 0;
      attempt < ROLE_KEY_GENERATION_MAX_ATTEMPTS;
      attempt++
    ) {
      const suffix = this.generateRandomSuffix();
      const candidateKey = `${baseKey.slice(0, maxBaseLength)}-${suffix}`;
      const existingKey = await this.roleRepository.findOne({
        where: { key: candidateKey },
      });

      if (!existingKey || existingKey.id === excludedRoleId) {
        return candidateKey;
      }
    }

    throw new ConflictException('Unable to generate a unique role key');
  }

  private slugify(name: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, ROLE_KEY_MAX_LENGTH);

    if (!slug) {
      throw new BadRequestException(
        'Role name must contain at least one letter or number',
      );
    }

    return slug;
  }

  private generateRandomSuffix(): string {
    const bytes = randomBytes(ROLE_KEY_SUFFIX_LENGTH);
    return Array.from(bytes, (byte) =>
      ROLE_KEY_SUFFIX_ALPHABET.charAt(byte % ROLE_KEY_SUFFIX_ALPHABET.length),
    ).join('');
  }
}
