import { BadRequestException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { UserRepository } from '../../repositories/user.repository';
import { UserService, visiblePublicUserSql } from '../../services/user.service';
import { parseUtcDate } from '../../utils/top-experience-range';
import { GetTopDmExperienceOutput } from './get-top-dm-experience.output';
import { GetTopDmExperienceQuery } from './get-top-dm-experience.query';

type TRankedDmExpRow = {
  userId: string;
  gainedDmExp: string | number;
};

@QueryHandler(GetTopDmExperienceQuery)
export class GetTopDmExperienceHandler implements IQueryHandler<
  GetTopDmExperienceQuery,
  GetTopDmExperienceOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    @InjectRepository(UserExpLog)
    private readonly userExpLogRepository: Repository<UserExpLog>,
  ) {}

  async execute(
    query: GetTopDmExperienceQuery,
  ): Promise<GetTopDmExperienceOutput> {
    const range = this.dateRange(query.params.startDate, query.params.endDate);
    const rows = await this.userExpLogRepository
      .createQueryBuilder('log')
      .innerJoin('log.user', 'owner')
      .select('owner.id', 'userId')
      .addSelect('SUM(log.amount)', 'gainedDmExp')
      .where('log.type = :type', { type: UserExpLogTypeEnum.DM })
      .andWhere('log.createdAt >= :startAt', { startAt: range.start })
      .andWhere('log.createdAt < :endAt', { endAt: range.endExclusive })
      .andWhere(visiblePublicUserSql('"owner"."id"'))
      .groupBy('owner.id')
      .orderBy('SUM(log.amount)', 'DESC')
      .addOrderBy('owner.id', 'ASC')
      .limit(3)
      .getRawMany<TRankedDmExpRow>();

    if (rows.length === 0) {
      return new GetTopDmExperienceOutput([], [], []);
    }

    const users = await this.userRepository.find({
      where: { id: In(rows.map((row) => row.userId)) },
      relations: { avatarFile: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));
    const ranked: { user: User; gainedDmExp: number }[] = [];
    for (const row of rows) {
      const user = usersById.get(row.userId);
      const gainedDmExp = Number(row.gainedDmExp);
      if (!user || !Number.isInteger(gainedDmExp)) {
        continue;
      }
      ranked.push({ user, gainedDmExp });
    }

    await this.userService.attachPublicRoles(ranked.map((item) => item.user));
    const avatarUrls = await Promise.all(
      ranked.map((item) => this.userService.resolveAvatarUrl(item.user)),
    );

    return new GetTopDmExperienceOutput(
      ranked.map((item) => item.user),
      avatarUrls.map((avatarUrl) => avatarUrl ?? null),
      ranked.map((item) => item.gainedDmExp),
    );
  }

  private dateRange(
    startDate: string,
    endDate: string,
  ): { start: Date; endExclusive: Date } {
    const start = parseUtcDate(startDate);
    const end = parseUtcDate(endDate);
    if (!start || !end || end.getTime() < start.getTime()) {
      throw new BadRequestException('Date range is invalid');
    }

    const endExclusive = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1),
    );
    return { start, endExclusive };
  }
}
