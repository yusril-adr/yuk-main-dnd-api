import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '@entities/main/iam/permission.entity';
import { Role } from '@entities/main/iam/role.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';
import { RoleController } from './role.controller';
import { RoleRepository } from './role.repository';
import { RolePermissionRepository } from './role-permission.repository';
import { RoleService } from './role.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, Permission])],
  controllers: [RoleController],
  providers: [RoleRepository, RolePermissionRepository, RoleService],
  exports: [RoleRepository, RolePermissionRepository, RoleService],
})
export class RoleModule {}
