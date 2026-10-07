import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, QueryFailedError } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { File } from '@entities/main/file.entity';
import { FileStatusEnum } from '@modules/Global/enum/file-status.enum';
import { UserService } from '../../services/user.service';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    const { params } = command;

    await this.userService.checkEmailUniqueness(params.email);
    const hashedPassword = await this.userService.hashPassword(params.password);

    const { roleIds, avatarFileId, ...userPayload } = params;
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
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const fileRepo = manager.getRepository(File);
        const avatarFile = movedAvatarFile
          ? await fileRepo.save(movedAvatarFile)
          : null;
        const userEntity = userRepo.create({
          ...userPayload,
          ...(userId ? { id: userId } : {}),
          password: hashedPassword,
          avatarFile,
        });
        const result = await userRepo.save(userEntity);

        if (roleIds?.length) {
          await this.userService.assignRoles(manager, result, roleIds);
        }
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
  }
}