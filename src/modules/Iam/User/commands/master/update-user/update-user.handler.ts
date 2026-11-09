import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { File } from '@entities/main/file.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserRepository } from '../../../repositories/user.repository';
import { UserService } from '../../../services/user.service';
import { conflictFromUserUniqueViolation } from '../../../utils/user-unique-conflict';
import { UpdateUserCommand } from './update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const { id, params } = command;

    const userEntity = await this.userRepository.findOne({
      where: { id },
      relations: { userRoles: { role: true }, avatarFile: true },
    });
    if (!userEntity) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (userEntity.isGuest) {
      if (params.email !== undefined || params.password !== undefined) {
        throw new BadRequestException(
          'Guest users cannot have email or password; link them to an account instead',
        );
      }
      if (params.roleIds !== undefined) {
        throw new BadRequestException(
          'Guest users cannot be assigned roles; link them to an account instead',
        );
      }
    }

    if (params.email) {
      await this.userService.checkEmailUniqueness(params.email, id);
    }

    if (params.username) {
      await this.userService.checkUsernameUniqueness(params.username, id);
    }

    // The global whitelist strips undeclared fields, so the rest is safe to
    // copy. The plaintext password is kept out and stored as a hash instead.
    const { roleIds, avatarFileId, password, ...userPayload } = params;
    const hashedPassword = password
      ? await this.userService.hashPassword(password)
      : undefined;
    const isAvatarFileProvided = avatarFileId !== undefined;
    const previousAvatarFile = userEntity.avatarFile;
    const isCurrentAvatarFile = avatarFileId === previousAvatarFile?.id;
    const temporaryAvatarFile =
      isAvatarFileProvided && avatarFileId !== null && !isCurrentAvatarFile
        ? await this.userService.resolveAvatarFile(
            avatarFileId,
            FileStatusEnum.TEMPORARY,
            id,
          )
        : null;
    const promotionDestination = temporaryAvatarFile
      ? this.userService.getAvatarPromotionDestination(temporaryAvatarFile, id)
      : undefined;
    const movedAvatarFile =
      temporaryAvatarFile && promotionDestination
        ? await this.userService.moveAvatarFile(
            temporaryAvatarFile,
            promotionDestination,
          )
        : null;
    const nextAvatarFile = movedAvatarFile
      ? movedAvatarFile
      : isAvatarFileProvided
        ? isCurrentAvatarFile
          ? previousAvatarFile
          : null
        : previousAvatarFile;

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const fileRepo = manager.getRepository(File);
        const avatarFile = movedAvatarFile
          ? await fileRepo.save(movedAvatarFile)
          : nextAvatarFile;

        Object.assign(userEntity, userPayload);
        if (hashedPassword !== undefined) {
          userEntity.password = hashedPassword;
        }
        if (isAvatarFileProvided) {
          userEntity.avatarFile = avatarFile;
        }

        const result = await userRepo.save(userEntity);

        if (roleIds !== undefined) {
          await manager.getRepository(UserRole).delete({ user: { id } });
          if (roleIds.length) {
            await this.userService.assignRoles(manager, result, roleIds);
          }
        }
      });
    } catch (error) {
      if (movedAvatarFile && temporaryAvatarFile) {
        await this.userService.restoreTemporaryAvatarFile(
          movedAvatarFile,
          temporaryAvatarFile,
        );
      }

      // Map 23505 by constraint: user_roles has its own unique index (see helper).
      const conflict = conflictFromUserUniqueViolation(error);
      if (conflict) {
        throw conflict;
      }

      throw error;
    }

    if (
      isAvatarFileProvided &&
      previousAvatarFile &&
      previousAvatarFile.id !== nextAvatarFile?.id
    ) {
      await this.userService.cleanupAvatarFile(previousAvatarFile);
    }
  }
}
