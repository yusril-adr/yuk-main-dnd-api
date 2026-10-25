import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import { UserExpLogDirectionEnum } from '@shared/enums/user-exp-log-direction.enum';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';

export type AddUserExperiencePointsParams = {
  userId: string;
  type: UserExpLogTypeEnum;
  direction?: UserExpLogDirectionEnum;
  amount: number;
  description?: string;
};

export type AddUserPointsParams = {
  userId: string;
  type: UserPointLogTypeEnum;
  amount: number;
  description?: string;
};

export type AddManyUserExperiencePointsParams = {
  userIds: string[];
  type: UserExpLogTypeEnum;
  direction?: UserExpLogDirectionEnum;
  amount: number;
  description?: string;
};

export type AddManyUserPointsParams = {
  userIds: string[];
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

    const direction = this.resolveExperienceDirection(params.direction);

    try {
      await this.run(manager, (txManager) =>
        this.applyExperiencePoints(txManager, {
          userIds: [params.userId],
          type: params.type,
          direction,
          amount: params.amount,
          description: params.description,
        }),
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
        this.applyPoints(txManager, {
          userIds: [params.userId],
          type: params.type,
          amount: params.amount,
          description: params.description,
        }),
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

  async addExperiencePointsToMany(
    params: AddManyUserExperiencePointsParams,
    manager?: EntityManager,
  ): Promise<void> {
    if (
      params.type !== UserExpLogTypeEnum.PLAYER &&
      params.type !== UserExpLogTypeEnum.DM
    ) {
      throw new BadRequestException('Experience type is invalid');
    }

    if (!Number.isInteger(params.amount) || params.amount < 1) {
      throw new BadRequestException('Experience amount is invalid');
    }

    const direction = this.resolveExperienceDirection(params.direction);

    const userIds = [...new Set(params.userIds)];
    if (userIds.length === 0) {
      return;
    }

    try {
      await this.run(manager, (txManager) =>
        this.applyExperiencePoints(txManager, {
          ...params,
          direction,
          userIds,
        }),
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

  async addPointsToMany(
    params: AddManyUserPointsParams,
    manager?: EntityManager,
  ): Promise<void> {
    if (
      params.type !== UserPointLogTypeEnum.INCOME &&
      params.type !== UserPointLogTypeEnum.EXPENSE
    ) {
      throw new BadRequestException('Point type is invalid');
    }

    if (!Number.isInteger(params.amount) || params.amount < 1) {
      throw new BadRequestException('Point amount is invalid');
    }

    const userIds = [...new Set(params.userIds)];
    if (userIds.length === 0) {
      return;
    }

    try {
      await this.run(manager, (txManager) =>
        this.applyPoints(txManager, {
          ...params,
          userIds,
        }),
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

  private resolveExperienceDirection(
    direction: UserExpLogDirectionEnum | undefined,
  ): UserExpLogDirectionEnum {
    if (direction === undefined) {
      return UserExpLogDirectionEnum.INCREMENT;
    }

    if (
      direction !== UserExpLogDirectionEnum.INCREMENT &&
      direction !== UserExpLogDirectionEnum.DECREMENT
    ) {
      throw new BadRequestException('Experience direction is invalid');
    }

    return direction;
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

  private lockLiveUsers(
    userRepo: Repository<User>,
    userIds: string[],
  ): Promise<User[]> {
    return userRepo.find({
      where: { id: In(userIds) },
      lock: { mode: 'pessimistic_write' },
      order: { id: 'ASC' },
    });
  }

  private async applyExperiencePoints(
    manager: EntityManager,
    params: AddManyUserExperiencePointsParams,
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

    const direction = params.direction ?? UserExpLogDirectionEnum.INCREMENT;
    const isDecrement = direction === UserExpLogDirectionEnum.DECREMENT;
    const delta = isDecrement
      ? `"${expColumn}" - :amount`
      : `"${expColumn}" + :amount`;

    const userRepo = manager.getRepository(User);
    const logRepo = manager.getRepository(UserExpLog);
    const { userIds } = params;

    const users = await this.lockLiveUsers(userRepo, userIds);
    const found = new Set(users.map((user) => user.id));
    const missing = userIds.filter((userId) => !found.has(userId));
    if (missing.length) {
      throw new NotFoundException(`User with id ${missing} not found`);
    }

    if (isDecrement) {
      const expById = new Map(
        users.map((user) => [user.id, user[expProperty]]),
      );
      const shortIds = userIds.filter(
        (userId) => expById.get(userId)! < params.amount,
      );
      if (shortIds.length === 1) {
        throw new BadRequestException('User does not have enough experience');
      }
      if (shortIds.length > 1) {
        throw new BadRequestException(
          `Users with ids ${shortIds} do not have enough experience`,
        );
      }
    }

    // increment() does not set updatedAt, and TypeORM adds deleted_at IS NULL only on selects.
    // One UPDATE keeps the change atomic and skips soft-deleted users.
    const update = userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        [expProperty]: () => delta,
        updatedAt: () => 'now()',
      })
      .where('id IN (:...ids)', { ids: userIds })
      .andWhere('deleted_at IS NULL')
      .setParameter('amount', params.amount);

    if (isDecrement) {
      update.andWhere(`"${expColumn}" >= :amount`);
    }

    const result = await update.execute();

    if (result.affected !== userIds.length) {
      throw new BadRequestException(
        'Experience update did not apply to every user',
      );
    }

    await logRepo.save(
      userIds.map((userId) =>
        logRepo.create({
          user: { id: userId },
          amount: params.amount,
          type: params.type,
          direction,
          description: params.description,
        }),
      ),
    );

    // TODO: Insert level-up logic here, in this same transaction, after the XP credit.
    // PLAYER recomputes playerLevel from the updated playerExp.
    // DM recomputes dmLevel from the updated dmExp.
    // Do not change the other track, points, or these log rows.
  }

  private async applyPoints(
    manager: EntityManager,
    params: AddManyUserPointsParams,
  ): Promise<void> {
    let delta: string;
    if (params.type === UserPointLogTypeEnum.INCOME) {
      delta = '"points" + :amount';
    } else {
      delta = '"points" - :amount';
    }

    const userRepo = manager.getRepository(User);
    const logRepo = manager.getRepository(UserPointLog);
    const { userIds } = params;

    const users = await this.lockLiveUsers(userRepo, userIds);
    const found = new Set(users.map((user) => user.id));
    const missing = userIds.filter((userId) => !found.has(userId));
    if (missing.length) {
      throw new NotFoundException(`User with id ${missing} not found`);
    }

    if (params.type === UserPointLogTypeEnum.EXPENSE) {
      const pointsById = new Map(users.map((user) => [user.id, user.points]));
      const shortIds = userIds.filter(
        (userId) => pointsById.get(userId)! < params.amount,
      );
      if (shortIds.length === 1) {
        throw new BadRequestException('User does not have enough points');
      }
      if (shortIds.length > 1) {
        throw new BadRequestException(
          `Users with ids ${shortIds} do not have enough points`,
        );
      }
    }

    // increment() does not set updatedAt, and TypeORM adds deleted_at IS NULL only on selects.
    // One UPDATE keeps the add atomic and skips soft-deleted users.
    const update = userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        points: () => delta,
        updatedAt: () => 'now()',
      })
      .where('id IN (:...ids)', { ids: userIds })
      .andWhere('deleted_at IS NULL')
      .setParameter('amount', params.amount);

    if (params.type === UserPointLogTypeEnum.EXPENSE) {
      update.andWhere('points >= :amount');
    }

    const result = await update.execute();

    if (result.affected !== userIds.length) {
      throw new BadRequestException('Point update did not apply to every user');
    }

    await logRepo.save(
      userIds.map((userId) =>
        logRepo.create({
          user: { id: userId },
          amount: params.amount,
          type: params.type,
          description: params.description,
        }),
      ),
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
