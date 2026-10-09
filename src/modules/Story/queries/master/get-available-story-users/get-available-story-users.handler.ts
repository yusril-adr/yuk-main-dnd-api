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
import { GetAvailableStoryUsersQuery } from './get-available-story-users.query';
import { GetAvailableStoryUsersOutput } from './get-available-story-users.output';

@QueryHandler(GetAvailableStoryUsersQuery)
export class GetAvailableStoryUsersHandler implements IQueryHandler<
  GetAvailableStoryUsersQuery,
  GetAvailableStoryUsersOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: GetAvailableStoryUsersQuery,
  ): Promise<GetAvailableStoryUsersOutput> {
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

    const findOptions: FindManyOptions<User> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    if (params.search) {
      const searchCondition: FindOptionsWhere<User>[] = [
        { username: ILike(`%${params.search}%`) },
        { displayName: ILike(`%${params.search}%`) },
        { email: ILike(`%${params.search}%`) },
      ];
      findOptions.where = mergeWhereConditions(
        findOptions.where,
        ...searchCondition,
      );
    }

    if (excludedUserIds.length > 0) {
      findOptions.where = mergeEachWhereConditions(findOptions.where, {
        id: Not(In(excludedUserIds)),
      });
    }

    const users = await this.userRepository.find({
      ...findOptions,
      relations: { userRoles: { role: true }, avatarFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const avatarUrls = users.map((user) =>
      user.avatarFile
        ? this.storageService.getPublicUrlSync(user.avatarFile)
        : undefined,
    );

    const count = await this.userRepository.count(findOptions);

    return GetAvailableStoryUsersOutput.from(users, avatarUrls, count);
  }
}
