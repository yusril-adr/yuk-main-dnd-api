import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Permission } from '@entities/main/iam/permission.entity';
import { MasterPermissionController } from './controllers/master-permission.controller';
import { PermissionRepository } from './repositories/permission.repository';
import { PaginatePermissionsHandler } from './queries/master/paginate-permissions/paginate-permissions.handler';
import { PermissionOptionsHandler } from './queries/master/permission-options/permission-options.handler';

const queryHandlers = [PaginatePermissionsHandler, PermissionOptionsHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), CqrsModule],
  controllers: [MasterPermissionController],
  providers: [PermissionRepository, ...queryHandlers],
  exports: [PermissionRepository],
})
export class PermissionModule {}
