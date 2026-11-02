import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
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

    await this.userService.checkUsernameUniqueness(params.username);

    return await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const saved = await userRepo.save(
        userRepo.create({
          username: params.username,
          displayName: params.displayName,
          isGuest: true,
          email: null,
          password: null,
          createdBy: { id: actor.id },
        }),
      );
      const reloaded = await userRepo.findOne({
        where: { id: saved.id },
        relations: {
          userRoles: { role: true },
          avatarFile: true,
        },
      });
      return reloaded!;
    });
  }
}
