import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserService } from '@modules/Iam/User/services/user.service';
import { StoryService } from '../../services/story.service';
import { PUBLIC_STORY_STATUSES } from '../../enums/story-status.enum';
import { PaginateUserJoinedStoriesQuery } from './paginate-user-joined-stories.query';
import { PaginateUserJoinedStoriesOutput } from './paginate-user-joined-stories.output';
import { PaginateUserJoinedStoriesInput } from './paginate-user-joined-stories.input';

@QueryHandler(PaginateUserJoinedStoriesQuery)
export class PaginateUserJoinedStoriesHandler implements IQueryHandler<
  PaginateUserJoinedStoriesQuery,
  PaginateUserJoinedStoriesOutput
> {
  constructor(
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storyService: StoryService,
    private readonly userService: UserService,
  ) {}

  async execute(
    query: PaginateUserJoinedStoriesQuery,
  ): Promise<PaginateUserJoinedStoriesOutput> {
    const { identifier, params } = query;
    const user = await this.userService.findPublicByIdentifier(identifier);

    const [memberships, count] = await this.storyMemberRepository.findAndCount({
      where: {
        user: { id: user.id },
        story: this.storyWhere(params),
      },
      relations: {
        story: { createdBy: { avatarFile: true }, bannerFile: true },
      },
      order: {
        story: {
          [camelCase(params.sortBy)]: params.order,
        },
      } as FindOptionsOrder<StoryMember>,
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    const stories = memberships.map((membership) => membership.story);
    const memberStatuses = memberships.map((membership) => membership.status);
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

    return new PaginateUserJoinedStoriesOutput(
      stories,
      bannerUrls,
      avatarCreatorUrls,
      currentMemberCounts,
      memberStatuses,
      count,
    );
  }

  private storyWhere(
    params: PaginateUserJoinedStoriesInput,
  ): FindOptionsWhere<Story> {
    const where: FindOptionsWhere<Story> = {
      deletedAt: IsNull(),
    };
    if (params.search) {
      where.title = ILike(`%${params.search}%`);
    }
    if (params.status !== undefined) {
      where.status = params.status;
    } else {
      where.status = In(PUBLIC_STORY_STATUSES);
    }
    if (params.type !== undefined) {
      where.type = params.type;
    }
    if (params.locationType !== undefined) {
      where.locationType = params.locationType;
    }
    return where;
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
}
