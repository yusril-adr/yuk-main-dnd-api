import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { File } from '@entities/main/file.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserRepository } from '@modules/Master/Iam/User/repositories/user.repository';
import { UserService } from '@modules/Master/Iam/User/services/user.service';
import { UpdateProfileCommand } from './update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler
  implements ICommandHandler<UpdateProfileCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<null> {
    const { payload, currentUser } = command;

    const userEntity = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: { avatarFile: true },
    });
    if (!userEntity) {
      throw new NotFoundException('User not found');
    }

    if (payload.email) {
      await this.userService.checkEmailUniqueness(payload.email, currentUser.id);
    }

    const { avatarFileId, ...userPayload } = payload;
    const isAvatarFileProvided = avatarFileId !== undefined;
    const previousAvatarFile = userEntity.avatarFile;
    const isCurrentAvatarFile = avatarFileId === previousAvatarFile?.id;
    const temporaryAvatarFile =
      isAvatarFileProvided && avatarFileId !== null && !isCurrentAvatarFile
        ? await this.userService.resolveAvatarFile(
            avatarFileId,
            FileStatusEnum.TEMPORARY,
            currentUser.id,
          )
        : null;
    const promotionDestination = temporaryAvatarFile
      ? this.userService.getAvatarPromotionDestination(
          temporaryAvatarFile,
          currentUser.id,
        )
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

        await userRepo.save(userEntity);
      });
    } catch (error) {
      if (movedAvatarFile && temporaryAvatarFile) {
        await this.userService.restoreTemporaryAvatarFile(
          movedAvatarFile,
          temporaryAvatarFile,
        );
      }

      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === '23505'
      ) {
        throw new ConflictException('A user with this email already exists');
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

    return null;
  }
}