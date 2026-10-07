import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { User } from '@entities/main/iam/user.entity';
import { Role } from '@entities/main/iam/role.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { RolePermission } from '@entities/main/iam/role-permission.entity';
import { Permission } from '@entities/main/iam/permission.entity';
import { File } from '@entities/main/file.entity';
import { MasterUserController } from './controllers/master-user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { RemoveUserHandler } from './commands/remove-user/remove-user.handler';
import { PaginateUsersHandler } from './queries/paginate-users/paginate-users.handler';
import { FindOneUserHandler } from './queries/find-one-user/find-one-user.handler';

const commandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  RemoveUserHandler,
];
const queryHandlers = [PaginateUsersHandler, FindOneUserHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      RolePermission,
      Permission,
      File,
    ]),
    CqrsModule,
  ],
  controllers: [MasterUserController],
  providers: [
    UserRepository,
    UserService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [UserRepository, UserService],
})
export class UserModule {}
