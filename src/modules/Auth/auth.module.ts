import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { User } from '@entities/main/iam/user.entity';
import { RoleModule } from '@modules/Master/Iam/Role/role.module';
import { UserModule } from '@modules/Master/Iam/User/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LoginHandler } from './commands/login/login.handler';
import { SwitchRoleHandler } from './commands/switch-role/switch-role.handler';
import { GetMeHandler } from './queries/get-me/get-me.handler';

const commandHandlers = [LoginHandler, SwitchRoleHandler];
const queryHandlers = [GetMeHandler];

@Module({
  imports: [TypeOrmModule.forFeature([User]), RoleModule, UserModule, CqrsModule],
  controllers: [AuthController],
  providers: [AuthService, ...commandHandlers, ...queryHandlers],
  exports: [AuthService],
})
export class AuthModule {}