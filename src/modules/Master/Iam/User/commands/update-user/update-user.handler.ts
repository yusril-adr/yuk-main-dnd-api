import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserRole } from '@entities/main/iam/user-role.entity';
import { File } from '@entities/main/file.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserRepository } from '../../repositories/user.repository';
import { UserService } from '../../services/user.service';
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

    if (params.email) {
      await this.userService.checkEmailUniqueness(params.email, id);
    }

    if (params.password) {
      params.password = await this.userService.hashPassword(params.password);
    }

    const { roleIds, avatarFileId, ...userPayload } = params;
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