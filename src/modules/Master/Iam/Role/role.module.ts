import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '@entities/main/permission.entity';
import { Role } from '@entities/main/role.entity';
import { RolePermission } from '@entities/main/role-permission.entity';
import { RoleController } from './role.controller';
import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, Permission])],
  controllers: [RoleController],
  providers: [RoleRepository, RoleService],
  exports: [RoleRepository, RoleService],
})
export class RoleModule {}
