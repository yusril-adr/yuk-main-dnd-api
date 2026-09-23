import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { User } from '@entities/main/iam/user.entity';
import { Role } from '@entities/main/iam/role.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { toCamelCaseArray } from '@shared/utils/common';

// Load .env file
config();

type TUserSeedData = {
  username?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  playerExp?: number;
  playerLevel?: number;
  dmExp?: number;
  dmLevel?: number;
  roles?: string[];
};

export default class UserSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const logger = new Logger(UserSeeder.name);
    logger.log(
      '/* ------------------------- Start Seeding User Data ------------------------ */',
    );

    const configService = new ConfigService();
    const dummyPassword = bcrypt.hashSync(
      configService.get('USER_DUMMY_PASSWORD'),
      parseInt(configService.get<string>('SALT_ROUND') as string),
    );
    const JSON_FILE_PATH = path.join(__dirname, './datas/user.json');

    const jsonDatas = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    const userDatas = toCamelCaseArray(
      JSON.parse(jsonDatas),
    ) as TUserSeedData[];

    await dataSource.transaction(async (transactionalEntityManager) => {
      const userRepository = transactionalEntityManager.getRepository(User);
      const roleRepository = transactionalEntityManager.getRepository(Role);
      const userRoleRepository =
        transactionalEntityManager.getRepository(UserRole);

      const emails = userDatas.map((user) => user.email);
      const existingUsers = await userRepository.find({
        where: emails.map((email) => ({ email })),
      });
      const existingUserByEmail = new Map(
        existingUsers.map((user) => [user.email, user]),
      );

      const roleKeys = [
        ...new Set(userDatas.flatMap((user) => user.roles ?? [])),
      ];
      const existingRoles = await roleRepository.find({
        where: roleKeys.map((key) => ({ key })),
      });
      const roleByKey = new Map(existingRoles.map((role) => [role.key, role]));

      let createdUsers = 0;
      let createdUserRoles = 0;

      for (const userData of userDatas) {
        let user = existingUserByEmail.get(userData.email);
        if (!user) {
          user = await userRepository.save(
            userRepository.create({
              username: userData.username,
              email: userData.email,
              displayName: userData.displayName,
              avatarUrl: userData.avatarUrl,
              bio: userData.bio,
              playerExp: userData.playerExp,
              playerLevel: userData.playerLevel,
              dmExp: userData.dmExp,
              dmLevel: userData.dmLevel,
              password: dummyPassword,
            }),
          );
          createdUsers++;
        }

        const existingUserRoles = await userRoleRepository.find({
          where: { user: { id: user.id } },
          relations: { role: true },
        });
        const linkedRoleIds = new Set(
          existingUserRoles.map((userRole) => userRole.role.id),
        );

        const userRolesToSave: UserRole[] = [];
        for (const roleKey of userData.roles ?? []) {
          const role = roleByKey.get(roleKey);
          if (role && !linkedRoleIds.has(role.id)) {
            userRolesToSave.push(userRoleRepository.create({ user, role }));
          }
        }

        if (userRolesToSave.length) {
          await userRoleRepository.save(userRolesToSave);
          createdUserRoles += userRolesToSave.length;
        }
      }

      logger.log(`Created ${createdUsers} user entries`);
      logger.log(`Created ${createdUserRoles} user role entries`);
      logger.log(
        '/* ------------------------- Finish Seeding User Data ------------------------ */',
      );
    });
  }
}
