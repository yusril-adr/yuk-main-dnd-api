import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';
import { AddUserPointsCommand } from './add-user-points.command';

@CommandHandler(AddUserPointsCommand)
export class AddUserPointsHandler implements ICommandHandler<AddUserPointsCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: AddUserPointsCommand): Promise<void> {
    const { id, params } = command;

    let delta: string;
    if (params.type === UserPointLogTypeEnum.INCOME) {
      delta = '"points" + :amount';
    } else if (params.type === UserPointLogTypeEnum.EXPENSE) {
      delta = '"points" - :amount';
    } else {
      throw new BadRequestException('Point type is invalid');
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const logRepo = manager.getRepository(UserPointLog);

        const update = userRepo
          .createQueryBuilder()
          .update(User)
          .set({
            points: () => delta,
            updatedAt: () => 'now()',
          })
          .where('id = :id', { id })
          .andWhere('deleted_at IS NULL')
          .setParameter('amount', params.amount);

        if (params.type === UserPointLogTypeEnum.EXPENSE) {
          update.andWhere('points >= :amount');
        }

        const result = await update.execute();

        if (result.affected === 0) {
          if (params.type === UserPointLogTypeEnum.INCOME) {
            throw new NotFoundException(`User with id ${id} not found`);
          }

          const user = await userRepo.findOne({ where: { id } });
          if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
          }

          throw new BadRequestException('User does not have enough points');
        }

        await logRepo.save(
          logRepo.create({
            user: { id },
            amount: params.amount,
            type: params.type,
            description: params.description,
          }),
        );
      });
    } catch (error) {
      if (isNumericValueOutOfRange(error)) {
        throw new BadRequestException(
          'Point amount overflows the stored points value',
        );
      }

      throw error;
    }
  }
}

function isNumericValueOutOfRange(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError: unknown = error.driverError;
  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    'code' in driverError &&
    driverError.code === '22003'
  );
}
