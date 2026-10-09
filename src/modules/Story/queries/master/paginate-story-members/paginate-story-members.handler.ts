import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  IsNull,
  Repository,
} from 'typeorm';
import { camelCase, snakeCase } from 'typeorm/util/StringUtils';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import dayjs from '@shared/utils/dayjs';
import {
  getAllEntityProperties,
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { PaginateStoryMembersQuery } from './paginate-story-members.query';
import {
  PaginateStoryMembersOutput,
  StoryMemberItemDto,
} from './paginate-story-members.output';
import { PaginateStoryMembersInput } from './paginate-story-members.input';

@QueryHandler(PaginateStoryMembersQuery)
export class PaginateStoryMembersHandler implements IQueryHandler<
  PaginateStoryMembersQuery,
  PaginateStoryMembersOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginateStoryMembersQuery,
  ): Promise<PaginateStoryMembersOutput> {
    const { id, params } = query;

    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    // withDeleted keeps a soft-deleted user on the row.
    // find() without it left-joins user and omits that user.
    let findOptions: FindManyOptions<StoryMember> = {
      relations: { user: { avatarFile: true } },
      withDeleted: true,
    };
    findOptions = this.sortQuery(findOptions, params);
    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);
    findOptions.where = mergeEachWhereConditions(findOptions.where, {
      story: { id },
      deletedAt: IsNull(),
    });

    const [members, count] = await this.storyMemberRepository.findAndCount({
      ...findOptions,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const items: StoryMemberItemDto[] = [];
    for (const member of members) {
      if (member.deletedAt != null || !member.user) {
        continue;
      }
      items.push({
        id: member.id,
        status: member.status,
        createdAt: dayjs(member.createdAt).toISOString(),
        user: {
          id: member.user.id,
          displayName: member.user.deletedAt
            ? `${member.user.displayName} (Deleted User)`
            : member.user.displayName,
          avatarUrl: member.user.avatarFile
            ? this.storageService.getPublicUrlSync(member.user.avatarFile)
            : null,
        },
      });
    }

    return new PaginateStoryMembersOutput(items, count);
  }

  private sortQuery(
    query: FindManyOptions<StoryMember>,
    params: PaginateStoryMembersInput,
  ): FindManyOptions<StoryMember> {
    const sortable = new Set(
      getAllEntityProperties(StoryMember)
        .map((prop) => snakeCase(prop))
        .filter(
          (column) =>
            column !== 'story' && column !== 'user' && column !== 'status',
        ),
    );
    const sortBy = sortable.has(params.sortBy) ? params.sortBy : 'updated_at';
    const direction = params.order ?? OrderKeyEnum.ASC;

    query.order = {
      status: OrderKeyEnum.DESC,
      [camelCase(sortBy)]: direction,
    };
    return query;
  }

  private searchQuery(
    query: FindManyOptions<StoryMember>,
    params: PaginateStoryMembersInput,
  ): FindManyOptions<StoryMember> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<StoryMember>[] = [
        { user: { username: ILike(`%${params.search}%`) } },
        { user: { displayName: ILike(`%${params.search}%`) } },
        { user: { email: ILike(`%${params.search}%`) } },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<StoryMember>,
    params: PaginateStoryMembersInput,
  ): FindManyOptions<StoryMember> {
    if (params.status !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        status: params.status,
      });
    }
    return query;
  }
}
