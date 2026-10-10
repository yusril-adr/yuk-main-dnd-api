import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBalanceService } from '../../../services/user-balance.service';
import { AddUserExperiencePointsCommand } from './add-user-experience-points.command';

@CommandHandler(AddUserExperiencePointsCommand)
export class AddUserExperiencePointsHandler implements ICommandHandler<AddUserExperiencePointsCommand> {
  constructor(private readonly userBalanceService: UserBalanceService) {}

  async execute(command: AddUserExperiencePointsCommand): Promise<void> {
    const { id, params } = command;

    await this.userBalanceService.addExperiencePoints({
      userId: id,
      type: params.type,
      amount: params.amount,
      description: params.description,
    });
  }
}
