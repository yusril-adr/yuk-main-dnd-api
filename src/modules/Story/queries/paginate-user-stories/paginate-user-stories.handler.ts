import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserService } from '@modules/Iam/User/services/user.service';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { PUBLIC_STORY_STATUSES } from '../../enums/story-status.enum';
import { StoryRepository } from '../../repositories/story.repository';
import { StoryService } from '../../services/story.service';
import { PaginateUserStoriesQuery } from './paginate-user-stories.query';
import { PaginateUserStoriesOutput } from './paginate-user-stories.output';
import { PaginateUserStoriesInput } from './paginate-user-stories.input';

@QueryHandler(PaginateUserStoriesQuery)
export class PaginateUserStoriesHandler implements IQueryHandler<
  PaginateUserStoriesQuery,
  PaginateUserStoriesOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storyService: StoryService,
    private readonly userService: UserService,
  ) {}

  async execute(
    query: PaginateUserStoriesQuery,
  ): Promise<PaginateUserStoriesOutput> {
    const { identifier, params } = query;
    const user = await this.userService.findPublicByIdentifier(identifier);

    let findOptions: FindManyOptions<Story> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params, user.id);

    const [stories, count] = await this.storyRepository.findAndCount({
      ...findOptions,
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const bannerUrls = stories.map((story) =>
      this.storyService.resolveBannerUrl(story),
    );
    const avatarCreatorUrls = stories.map((story) =>
      this.storyService.resolveAvatarCreatorUrl(story),
    );
    const memberCounts = await this.countCurrentMembers(
      stories.map((story) => story.id),
    );
    const currentMemberCounts = stories.map(
      (story) => memberCounts.get(story.id) ?? 0,
    );

    return new PaginateUserStoriesOutput(
      stories,
      bannerUrls,
      avatarCreatorUrls,
      currentMemberCounts,
      count,
    );
  }

  private async countCurrentMembers(
    storyIds: string[],
  ): Promise<Map<string, number>> {
    if (storyIds.length === 0) {
      return new Map();
    }

    const rows = await this.storyMemberRepository
      .createQueryBuilder('member')
      .select('member.story_id', 'story_id')
      .addSelect('COUNT(member.id)', 'member_count')
      .where('member.story_id IN (:...storyIds)', { storyIds })
      .andWhere('member.deleted_at IS NULL')
      .groupBy('member.story_id')
      .getRawMany<{
        story_id?: string;
        storyId?: string;
        member_count?: string | number;
        memberCount?: string | number;
      }>();

    const counts = new Map<string, number>();
    for (const row of rows) {
      const storyId = row.story_id ?? row.storyId;
      const memberCount = row.member_count ?? row.memberCount;
      if (storyId != null) {
        counts.set(storyId, Number(memberCount));
      }
    }
    return counts;
  }

  private searchQuery(
    query: FindManyOptions<Story>,
    params: PaginateUserStoriesInput,
  ): FindManyOptions<Story> {
    if (params.search) {
      const searchCondition: FindOptionsWhere<Story>[] = [
        {
          title: ILike(`%${params.search}%`),
        },
      ];
      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
    return query;
  }

  private filterQuery(
    query: FindManyOptions<Story>,
    params: PaginateUserStoriesInput,
    userId: string,
  ): FindManyOptions<Story> {
    if (params.status !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        status: params.status,
      });
    } else {
      query.where = mergeEachWhereConditions(query.where, {
        status: In(PUBLIC_STORY_STATUSES),
      });
    }
    if (params.type !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        type: params.type,
      });
    }
    if (params.locationType !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        locationType: params.locationType,
      });
    }
    query.where = mergeEachWhereConditions(query.where, {
      createdBy: { id: userId },
    });
    return query;
  }
}
