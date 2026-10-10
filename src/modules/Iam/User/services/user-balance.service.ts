import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';

export type AddUserExperiencePointsParams = {
  userId: string;
  type: UserExpLogTypeEnum;
  amount: number;
  description?: string;
};

export type AddUserPointsParams = {
  userId: string;
  type: UserPointLogTypeEnum;
  amount: number;
  description?: string;
};

@Injectable()
export class UserBalanceService {
  constructor(private readonly dataSource: DataSource) {}

  async addExperiencePoints(
    params: AddUserExperiencePointsParams,
    manager?: EntityManager,
  ): Promise<void> {
    if (
      params.type !== UserExpLogTypeEnum.PLAYER &&
      params.type !== UserExpLogTypeEnum.DM
    ) {
      throw new BadRequestException('Experience type is invalid');
    }

    try {
      await this.run(manager, (txManager) =>
        this.applyExperiencePoints(txManager, params),
      );
    } catch (error) {
      if (isNumericValueOutOfRange(error)) {
        throw new BadRequestException(
          'Experience amount overflows the stored experience value',
        );
      }

      throw error;
    }
  }

  async addPoints(
    params: AddUserPointsParams,
    manager?: EntityManager,
  ): Promise<void> {
    if (
      params.type !== UserPointLogTypeEnum.INCOME &&
      params.type !== UserPointLogTypeEnum.EXPENSE
    ) {
      throw new BadRequestException('Point type is invalid');
    }

    try {
      await this.run(manager, (txManager) =>
        this.applyPoints(txManager, params),
      );
    } catch (error) {
      if (isNumericValueOutOfRange(error)) {
        throw new BadRequestException(
          'Point amount overflows the stored points value',
        );
      }

      throw error;
    }
  }

  private run(
    manager: EntityManager | undefined,
    work: (manager: EntityManager) => Promise<void>,
  ): Promise<void> {
    if (manager) {
      return work(manager);
    }

    return this.dataSource.transaction(work);
  }

  private async applyExperiencePoints(
    manager: EntityManager,
    params: AddUserExperiencePointsParams,
  ): Promise<void> {
    let expProperty: 'playerExp' | 'dmExp';
    let expColumn: 'player_exp' | 'dm_exp';

    if (params.type === UserExpLogTypeEnum.PLAYER) {
      expProperty = 'playerExp';
      expColumn = 'player_exp';
    } else {
      expProperty = 'dmExp';
      expColumn = 'dm_exp';
    }

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
      .where('id = :id', { id: params.userId })
      .andWhere('deleted_at IS NULL')
      .setParameter('amount', params.amount)
      .execute();

    if (!result.affected) {
      throw new NotFoundException(`User with id ${params.userId} not found`);
    }

    await logRepo.save(
      logRepo.create({
        user: { id: params.userId },
        amount: params.amount,
        type: params.type,
        description: params.description,
      }),
    );

    // TODO: Insert level-up logic here, in this same transaction, after the XP credit.
    // PLAYER recomputes playerLevel from the updated playerExp.
    // DM recomputes dmLevel from the updated dmExp.
    // Do not change the other track, points, or this log row.
  }

  private async applyPoints(
    manager: EntityManager,
    params: AddUserPointsParams,
  ): Promise<void> {
    let delta: string;
    if (params.type === UserPointLogTypeEnum.INCOME) {
      delta = '"points" + :amount';
    } else {
      delta = '"points" - :amount';
    }

    const userRepo = manager.getRepository(User);
    const logRepo = manager.getRepository(UserPointLog);

    const update = userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        points: () => delta,
        updatedAt: () => 'now()',
      })
      .where('id = :id', { id: params.userId })
      .andWhere('deleted_at IS NULL')
      .setParameter('amount', params.amount);

    if (params.type === UserPointLogTypeEnum.EXPENSE) {
      update.andWhere('points >= :amount');
    }

    const result = await update.execute();

    if (result.affected === 0) {
      if (params.type === UserPointLogTypeEnum.INCOME) {
        throw new NotFoundException(`User with id ${params.userId} not found`);
      }

      const user = await userRepo.findOne({ where: { id: params.userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${params.userId} not found`);
      }

      throw new BadRequestException('User does not have enough points');
    }

    await logRepo.save(
      logRepo.create({
        user: { id: params.userId },
        amount: params.amount,
        type: params.type,
        description: params.description,
      }),
    );
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
