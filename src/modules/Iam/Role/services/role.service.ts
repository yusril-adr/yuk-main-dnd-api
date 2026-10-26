import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Permission } from '@entities/main/iam/permission.entity';
import { Role } from '@entities/main/iam/role.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';
import { generateUniqueSlug } from '@shared/utils/slug';
import { RoleRepository } from '../repositories/role.repository';

const ROLE_KEY_MAX_LENGTH = 50;
const ROLE_KEY_FALLBACK_PREFIX = 'role';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async assignPermissions(
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

  async generateUniqueKey(
    name: string,
    excludedRoleId?: string,
  ): Promise<string> {
    // Same strategy as story slugs: soft-deleted roles keep their key, so they
    // are checked too.
    const key = await generateUniqueSlug(name, {
      maxLength: ROLE_KEY_MAX_LENGTH,
      fallbackPrefix: ROLE_KEY_FALLBACK_PREFIX,
      isTaken: async (candidate) => {
        const role = await this.roleRepository.findOne({
          where: { key: candidate },
          withDeleted: true,
        });
        return !!role && role.id !== excludedRoleId;
      },
    });

    if (!key) {
      throw new ConflictException('Unable to generate a unique role key');
    }

    return key;
  }
}
