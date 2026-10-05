import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Logger } from '@nestjs/common';

import { Role } from '@entities/main/iam/role.entity';
import { Permission } from '@entities/main/iam/permission.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';

type TRoleSeedData = {
  key: string;
  name: string;
  description?: string;
  isShowInPublic?: boolean;
  permissions: string[];
};

export default class RoleSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const logger = new Logger(RoleSeeder.name);
    logger.log(
      '/* ------------------------- Start Seeding Role Data ------------------------ */',
    );

    const JSON_FILE_PATH = path.join(__dirname, './datas/role.json');
    const roleDatas: TRoleSeedData[] = JSON.parse(
      fs.readFileSync(JSON_FILE_PATH, 'utf-8'),
    );

    await dataSource.transaction(async (transactionalEntityManager) => {
      const roleRepository = transactionalEntityManager.getRepository(Role);
      const permissionRepository =
        transactionalEntityManager.getRepository(Permission);
      const rolePermissionRepository =
        transactionalEntityManager.getRepository(RolePermission);

      const roleKeys = roleDatas.map((role) => role.key);
      const existingRoles = await roleRepository.find({
        where: roleKeys.map((key) => ({ key })),
      });
      const existingRoleByKey = new Map(
        existingRoles.map((role) => [role.key, role]),
      );

      const permissionKeys = [
        ...new Set(roleDatas.flatMap((role) => role.permissions)),
      ];
      const existingPermissions = await permissionRepository.find({
        where: permissionKeys.map((key) => ({ key })),
      });
      const permissionByKey = new Map(
        existingPermissions.map((permission) => [permission.key, permission]),
      );

      let createdRoles = 0;
      let createdRolePermissions = 0;

      for (const roleData of roleDatas) {
        let role = existingRoleByKey.get(roleData.key);
        if (!role) {
          role = await roleRepository.save(
            roleRepository.create({
              key: roleData.key,
              name: roleData.name,
              description: roleData.description,
              isShowInPublic: roleData.isShowInPublic ?? true,
            }),
          );
          createdRoles++;
        }

        const existingRolePermissions = await rolePermissionRepository.find({
          where: { role: { id: role.id } },
          relations: { permission: true },
        });
        const linkedPermissionIds = new Set(
          existingRolePermissions.map((rolePermission) => rolePermission.permission.id),
        );

        const rolePermissionsToSave: RolePermission[] = [];
        for (const permissionKey of roleData.permissions) {
          const permission = permissionByKey.get(permissionKey);
          if (permission && !linkedPermissionIds.has(permission.id)) {
            rolePermissionsToSave.push(
              rolePermissionRepository.create({ role, permission }),
            );
          }
        }

        if (rolePermissionsToSave.length) {
          await rolePermissionRepository.save(rolePermissionsToSave);
          createdRolePermissions += rolePermissionsToSave.length;
        }
      }

      logger.log(`Created ${createdRoles} role entries`);
      logger.log(
        `Created ${createdRolePermissions} role permission entries`,
      );
      logger.log(
        '/* ------------------------- Finish Seeding Role Data ------------------------ */',
      );
    });
  }
}
