import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@entities/main/user.entity';
import { Role } from '@entities/main/role.entity';
import { UserRole } from '@entities/main/user-role.entity';
import { RolePermission } from '@entities/main/role-permission.entity';
import { Permission } from '@entities/main/permission.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      RolePermission,
      Permission,
    ]),
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UserModule {}
