import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Logger } from '@nestjs/common';

import { Permission } from '@entities/main/iam/permission.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';

export default class PermissionSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const logger = new Logger(PermissionSeeder.name);
    logger.log(
      '/* ------------------------- Start Seeding Permission Data ------------------------ */',
    );

    const permissionDatas = Object.values(PermissionEnum).map((key) => {
      const [module, action] = key.split(':');
      return { module, action, key };
    });

    await dataSource.transaction(async (transactionalEntityManager) => {
      const permissionRepository =
        transactionalEntityManager.getRepository(Permission);

      const keys = permissionDatas.map((data) => data.key);
      const existingPermissions = await permissionRepository.find({
        where: keys.map((key) => ({ key })),
      });

      const existingKeys = existingPermissions.map(
        (permission) => permission.key,
      );
      const permissionsToSave = permissionDatas.filter(
        (data) => !existingKeys.includes(data.key),
      );

      if (!permissionsToSave.length) {
        logger.log('Permission already seeded');
        logger.log(
          '/* ------------------------- Finish Seeding Permission Data ------------------------ */',
        );
        return;
      }

      logger.log('Seeding Permission');
      const insertedPermissions =
        await permissionRepository.save(permissionsToSave);
      logger.log(`Created ${insertedPermissions.length} permission entries`);

      logger.log(
        '/* ------------------------- Finish Seeding Permission Data ------------------------ */',
      );
    });
  }
}
