import { NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { User } from '@entities/main/iam/user.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StorageService } from '@modules/Global/services/storage.service';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { StoryRepository } from '../../../repositories/story.repository';
import { PaginateAvailableStoryUsersQuery } from './paginate-available-story-users.query';
import { PaginateAvailableStoryUsersOutput } from './paginate-available-story-users.output';
import { PaginateAvailableStoryUsersInput } from './paginate-available-story-users.input';

@QueryHandler(PaginateAvailableStoryUsersQuery)
export class PaginateAvailableStoryUsersHandler implements IQueryHandler<
  PaginateAvailableStoryUsersQuery,
  PaginateAvailableStoryUsersOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginateAvailableStoryUsersQuery,
  ): Promise<PaginateAvailableStoryUsersOutput> {
    const { id, params } = query;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    const members = await this.storyMemberRepository.find({
      where: { story: { id }, deletedAt: IsNull() },
      relations: { user: true },
    });
    const excludedUserIds = members
      .map((member) => member.user?.id)
      .filter((userId): userId is string => Boolean(userId));
    if (story.createdBy?.id && !excludedUserIds.includes(story.createdBy.id)) {
      excludedUserIds.push(story.createdBy.id);
    }

    let findOptions: FindManyOptions<User> = {};
    findOptions = this.sortQuery(findOptions, params);
    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, excludedUserIds);

    const users = await this.userRepository.find({
      ...findOptions,
      relations: { avatarFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const avatarUrls = users.map((user) =>
      user.avatarFile
        ? this.storageService.getPublicUrlSync(user.avatarFile)
        : undefined,
    );

    const count = await this.userRepository.count(findOptions);

    return PaginateAvailableStoryUsersOutput.from(users, avatarUrls, count);
  }

  private sortQuery(
    query: FindManyOptions<User>,
    params: PaginateAvailableStoryUsersInput,
  ): FindManyOptions<User> {
    query.order = {
      [camelCase(params.sortBy)]: params.order,
    };
    return query;
  }

  private searchQuery(
    query: FindManyOptions<User>,
    params: PaginateAvailableStoryUsersInput,
  ): FindManyOptions<User> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<User>[] = [
        { username: ILike(`%${params.search}%`) },
        { displayName: ILike(`%${params.search}%`) },
        { email: ILike(`%${params.search}%`) },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<User>,
    excludedUserIds: string[],
  ): FindManyOptions<User> {
    if (excludedUserIds.length > 0) {
      query.where = mergeEachWhereConditions(query.where, {
        id: Not(In(excludedUserIds)),
      });
    }
    return query;
  }
}
