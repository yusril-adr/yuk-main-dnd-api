import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { User } from '@entities/main/iam/user.entity';
import { RoleModule } from '@modules/Iam/Role/role.module';
import { UserModule } from '@modules/Iam/User/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LoginHandler } from './commands/login/login.handler';
import { SwitchRoleHandler } from './commands/switch-role/switch-role.handler';
import { UpdateProfileHandler } from './commands/update-profile/update-profile.handler';
import { UpdatePasswordHandler } from './commands/update-password/update-password.handler';
import { GetMeHandler } from './queries/get-me/get-me.handler';

const commandHandlers = [
  LoginHandler,
  SwitchRoleHandler,
  UpdateProfileHandler,
  UpdatePasswordHandler,
];
const queryHandlers = [GetMeHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RoleModule,
    UserModule,
    CqrsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, ...commandHandlers, ...queryHandlers],
  exports: [AuthService],
})
export class AuthModule {}
