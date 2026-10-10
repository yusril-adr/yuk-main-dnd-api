import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { AddUserExperiencePointsCommand } from './add-user-experience-points.command';

@CommandHandler(AddUserExperiencePointsCommand)
export class AddUserExperiencePointsHandler implements ICommandHandler<AddUserExperiencePointsCommand> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: AddUserExperiencePointsCommand): Promise<void> {
    const { id, params } = command;

    let expProperty: 'playerExp' | 'dmExp';
    let expColumn: 'player_exp' | 'dm_exp';

    if (params.type === UserExpLogTypeEnum.PLAYER) {
      expProperty = 'playerExp';
      expColumn = 'player_exp';
    } else if (params.type === UserExpLogTypeEnum.DM) {
      expProperty = 'dmExp';
      expColumn = 'dm_exp';
    } else {
      throw new BadRequestException('Experience type is invalid');
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const logRepo = manager.getRepository(UserExpLog);

        // increment() does not set updatedAt, and TypeORM adds deleted_at IS NULL only on selects.
        // One UPDATE keeps the add atomic and skips soft-deleted users.
        const result = await userRepo
          .createQueryBuilder()
          .update(User)
          .set({
            [expProperty]: () => `"${expColumn}" + :amount`,
            updatedAt: () => 'now()',
          })
          .where('id = :id', { id })
          .andWhere('deleted_at IS NULL')
          .setParameter('amount', params.amount)
          .execute();

        if (!result.affected) {
          throw new NotFoundException(`User with id ${id} not found`);
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
          'Experience amount overflows the stored experience value',
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
