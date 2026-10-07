import * as bcrypt from 'bcrypt';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { UserService } from '@modules/Iam/User/services/user.service';
import { UpdatePasswordCommand } from './update-password.command';

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler implements ICommandHandler<UpdatePasswordCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<void> {
    const { payload, currentUser } = command;

    const userEntity = await this.userRepository.findOne({
      where: { id: currentUser.id },
    });
    if (!userEntity) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.currentPassword,
      userEntity.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    userEntity.password = await this.userService.hashPassword(
      payload.newPassword,
    );
    await this.userRepository.save(userEntity);
  }
}
