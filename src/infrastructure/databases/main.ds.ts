import 'reflect-metadata';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { SeederOptions } from 'typeorm-extension';

import { SnakeCaseNamingStrategy } from '@shared/strategies/snake-case-naming.strategy';
import UserSeeder from '../../../seeders/main/user.seed';
import PermissionSeeder from '../../../seeders/main/permission.seed';
import RoleSeeder from '../../../seeders/main/role.seed';

// Load .env file
config();

const configService = new ConfigService();

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: configService.get<string>('MAIN_DB_HOST'),
  port: configService.get<number>('MAIN_DB_PORT'),
  username: configService.get<string>('MAIN_DB_USERNAME'),
  password: configService.get<string>('MAIN_DB_PASSWORD'),
  database: configService.get<string>('MAIN_DB_DATABASE'),
  entities: [
    join(__dirname, '../../', 'entities/main', '*.entity.ts'),
  ],
  migrations: [join(__dirname, '../../../', 'migrations/main', '*.ts')],
  seeds: [PermissionSeeder, RoleSeeder, UserSeeder],
  factories: [join(__dirname, '../../../', 'factories', '*.factory.ts')],
  poolSize: configService.get<number>('MAIN_DB_POOL_SIZE'),
  connectTimeoutMS: configService.get<number>(
    'MAIN_DB_CONNECT_TIMEOUT_IN_MS',
  ),
  synchronize: false,
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
  migrationsTableName: 'typeorm_migrations',
  namingStrategy: new SnakeCaseNamingStrategy(),
};

export default new DataSource(options);
