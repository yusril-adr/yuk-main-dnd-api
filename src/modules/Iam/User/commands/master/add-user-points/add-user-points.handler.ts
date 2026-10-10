import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserBalanceService } from '../../../services/user-balance.service';
import { AddUserPointsCommand } from './add-user-points.command';

@CommandHandler(AddUserPointsCommand)
export class AddUserPointsHandler implements ICommandHandler<AddUserPointsCommand> {
  constructor(private readonly userBalanceService: UserBalanceService) {}

  async execute(command: AddUserPointsCommand): Promise<void> {
    const { id, params } = command;

    await this.userBalanceService.addPoints({
      userId: id,
      type: params.type,
      amount: params.amount,
      description: params.description,
    });
  }
}
