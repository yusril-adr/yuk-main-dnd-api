import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Permission } from '@entities/main/iam/permission.entity';
import { MasterPermissionController } from './controllers/master-permission.controller';
import { PermissionRepository } from './repositories/permission.repository';
import { PaginatePermissionsHandler } from './queries/paginate-permissions/paginate-permissions.handler';
import { FindAllPermissionsHandler } from './queries/find-all-permissions/find-all-permissions.handler';

const queryHandlers = [PaginatePermissionsHandler, FindAllPermissionsHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), CqrsModule],
  controllers: [MasterPermissionController],
  providers: [PermissionRepository, ...queryHandlers],
  exports: [PermissionRepository],
})
export class PermissionModule {}
