import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Role } from '@entities/main/iam/role.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { UserService } from '@modules/Iam/User/services/user.service';
import { isPostgresUniqueViolation } from '@shared/utils/postgres-error';
import { AuthService } from '../../services/auth.service';
import { GetMeOutput } from '../../queries/get-me/get-me.output';
import { RequestDmCommand } from './request-dm.command';

@CommandHandler(RequestDmCommand)
export class RequestDmHandler implements ICommandHandler<
  RequestDmCommand,
  GetMeOutput
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  async execute(command: RequestDmCommand): Promise<GetMeOutput> {
    const { currentUser, token } = command;

    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: {
        userRoles: { role: true },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Guests cannot log in; keep a defensive check anyway.
    if (user.isGuest) {
      throw new ForbiddenException(
        'Guests cannot request the dungeon-master role',
      );
    }

    const hasDungeonMaster = (user.userRoles ?? []).some(
      (userRole) => userRole.role?.key === 'dungeon-master',
    );
    if (hasDungeonMaster) {
      throw new ConflictException('User already has the dungeon-master role');
    }

    const dungeonMasterRole = await this.dataSource
      .getRepository(Role)
      .findOne({ where: { key: 'dungeon-master' } });
    if (!dungeonMasterRole) {
      throw new NotFoundException('Role with key dungeon-master not found');
    }

    try {
      // Append dungeon-master; do not replace existing roles.
      await this.dataSource.transaction(async (manager) => {
        await this.userService.assignRoles(manager, user, [
          dungeonMasterRole.id,
        ]);
      });
    } catch (error) {
      // user_roles has no unique (user_id, role_id) constraint today; keep this
      // mapping so a future unique index still returns 409 instead of 500.
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException('User already has the dungeon-master role');
      }
      throw error;
    }

    return this.authService.loginByAccessToken(token);
  }
}
