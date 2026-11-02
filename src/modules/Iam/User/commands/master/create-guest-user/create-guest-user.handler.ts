import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { File } from '@entities/main/file.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserService } from '../../../services/user.service';
import { CreateGuestUserCommand } from './create-guest-user.command';

@CommandHandler(CreateGuestUserCommand)
export class CreateGuestUserHandler implements ICommandHandler<
  CreateGuestUserCommand,
  User
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  async execute(command: CreateGuestUserCommand): Promise<User> {
    const { params, user: actor } = command;

    if (params.username) {
      await this.userService.checkUsernameUniqueness(params.username);
    }

    const { avatarFileId, ...guestPayload } = params;
    const temporaryAvatarFile = await this.userService.resolveAvatarFile(
      avatarFileId,
      FileStatusEnum.TEMPORARY,
    );
    const userId = temporaryAvatarFile
      ? this.userService.generateUserId()
      : undefined;
    const promotionDestination = temporaryAvatarFile
      ? this.userService.getAvatarPromotionDestination(
          temporaryAvatarFile,
          userId!,
        )
      : undefined;
    const movedAvatarFile =
      temporaryAvatarFile && promotionDestination
        ? await this.userService.moveAvatarFile(
            temporaryAvatarFile,
            promotionDestination,
          )
        : null;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const fileRepo = manager.getRepository(File);
        const avatarFile = movedAvatarFile
          ? await fileRepo.save(movedAvatarFile)
          : null;
        const userEntity = userRepo.create({
          ...guestPayload,
          ...(userId ? { id: userId } : {}),
          isGuest: true,
          email: null,
          password: null,
          createdBy: { id: actor.id },
          avatarFile,
        });
        const saved = await userRepo.save(userEntity);
        const reloaded = await userRepo.findOne({
          where: { id: saved.id },
          relations: {
            userRoles: { role: true },
            avatarFile: true,
          },
        });
        return reloaded!;
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
  }
}
