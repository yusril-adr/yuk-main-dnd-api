import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Permission } from '@entities/main/iam/permission.entity';
import { Role } from '@entities/main/iam/role.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';
import { RoleController } from './controllers/role.controller';
import { RoleRepository } from './repositories/role.repository';
import { RolePermissionRepository } from './repositories/role-permission.repository';
import { RoleService } from './services/role.service';
import { CreateRoleHandler } from './commands/create-role/create-role.handler';
import { UpdateRoleHandler } from './commands/update-role/update-role.handler';
import { RemoveRoleHandler } from './commands/remove-role/remove-role.handler';
import { PaginateRolesHandler } from './queries/paginate-roles/paginate-roles.handler';
import { FindOneRoleHandler } from './queries/find-one-role/find-one-role.handler';

const commandHandlers = [CreateRoleHandler, UpdateRoleHandler, RemoveRoleHandler];
const queryHandlers = [PaginateRolesHandler, FindOneRoleHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, Permission]), CqrsModule],
  controllers: [RoleController],
  providers: [
    RoleRepository,
    RolePermissionRepository,
    RoleService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [RolePermissionRepository],
})
export class RoleModule {}