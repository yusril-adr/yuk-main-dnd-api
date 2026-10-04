import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EntityManager } from 'typeorm';
import { Permission } from '@entities/main/iam/permission.entity';
import { Role } from '@entities/main/iam/role.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';
import { RoleRepository } from '../repositories/role.repository';

const ROLE_KEY_MAX_LENGTH = 50;
const ROLE_KEY_SUFFIX_LENGTH = 6;
const ROLE_KEY_GENERATION_MAX_ATTEMPTS = 10;
const ROLE_KEY_SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

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