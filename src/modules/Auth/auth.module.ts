import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@modules/Auth/auth.controller';
import { AuthService } from '@modules/Auth/auth.service';
import { User } from '@entities/main/user.entity';
import { UserModule } from '@modules/Master/Iam/User/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
