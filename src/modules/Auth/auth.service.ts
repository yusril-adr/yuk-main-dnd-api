import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TJWTPayload } from '@shared/types/jwt-payload.type';
import dayjs from '@shared/utils/dayjs';
import { AuthLoginPasswordParamDto } from '@modules/Auth/dtos/params/auth-login.param.dto';
import { AuthLoginPasswordResultDto } from '@modules/Auth/dtos/results/auth-login.result.dto';
import { UserEntityDto } from '@modules/Master/Iam/User/dtos/results/user-entity.result.dto';
import { UserRepository } from '@modules/Master/Iam/User/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async loginByPassword({
    email,
    password,
    role,
  }: AuthLoginPasswordParamDto): Promise<AuthLoginPasswordResultDto> {
    const user = await this.userRepository.findOne({
      where: {
        email,
        ...(role ? { role } : {}),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const tokenPayload: TJWTPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      this.configService.get<string>('ACCESS_TOKEN_KEY') as string,
      { expiresIn: '1d' },
    );
    const accessTokenExpiredAt = dayjs().add(1, 'day').toISOString();

    const result = new AuthLoginPasswordResultDto({
      ...user,
      accessToken,
      accessTokenExpiredAt,
    });

    return result;
  }

  async loginByAccessToken(token: string): Promise<UserEntityDto> {
    const decoded = jwt.verify(
      token,
      this.configService.get<string>('ACCESS_TOKEN_KEY') as string,
    ) as TJWTPayload;

    const user = await this.userRepository.findOne({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return new UserEntityDto().parseEntity(user);
  }
}
