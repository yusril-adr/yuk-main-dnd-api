import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { User } from '@entities/main/iam/user.entity';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import { RoleModule } from '@modules/Iam/Role/role.module';
import { UserModule } from '@modules/Iam/User/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LoginHandler } from './commands/login/login.handler';
import { SwitchRoleHandler } from './commands/switch-role/switch-role.handler';
import { UpdateProfileHandler } from './commands/update-profile/update-profile.handler';
import { UpdatePasswordHandler } from './commands/update-password/update-password.handler';
import { GetMeHandler } from './queries/get-me/get-me.handler';
import { PaginateMyExperiencePointsHandler } from './queries/paginate-my-experience-points/paginate-my-experience-points.handler';
import { PaginateMyPointsHandler } from './queries/paginate-my-points/paginate-my-points.handler';

const commandHandlers = [
  LoginHandler,
  SwitchRoleHandler,
  UpdateProfileHandler,
  UpdatePasswordHandler,
];
const queryHandlers = [
  GetMeHandler,
  PaginateMyExperiencePointsHandler,
  PaginateMyPointsHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserExpLog, UserPointLog]),
    RoleModule,
    UserModule,
    CqrsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, ...commandHandlers, ...queryHandlers],
  exports: [AuthService],
})
export class AuthModule {}
