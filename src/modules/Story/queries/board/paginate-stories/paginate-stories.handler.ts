import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, IsNull, Not, Repository } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { StoryService } from '../../../services/story.service';
import { PaginateStoriesQuery } from './paginate-stories.query';
import { PaginateStoriesOutput } from './paginate-stories.output';
import { PaginateStoriesInput } from './paginate-stories.input';

@QueryHandler(PaginateStoriesQuery)
export class PaginateStoriesHandler implements IQueryHandler<
  PaginateStoriesQuery,
  PaginateStoriesOutput
> {
  constructor(
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storyService: StoryService,
  ) {}

  async execute(query: PaginateStoriesQuery): Promise<PaginateStoriesOutput> {
    const { params, user } = query;

    const [memberships, count] = await this.storyMemberRepository.findAndCount({
      where: {
        user: { id: user.id },
        ...(params.memberStatus !== undefined
          ? { status: params.memberStatus }
          : {}),
        story: this.storyWhere(params),
      },
      relations: {
        story: { createdBy: { avatarFile: true }, bannerFile: true },
      },
      order: {
        story: {
          createdAt: OrderKeyEnum.DESC,
          id: OrderKeyEnum.ASC,
        },
      },
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

    return new PaginateStoriesOutput(
      stories,
      bannerUrls,
      avatarCreatorUrls,
      currentMemberCounts,
      memberStatuses,
      count,
    );
  }

  private storyWhere(params: PaginateStoriesInput): FindOptionsWhere<Story> {
    const where: FindOptionsWhere<Story> = {
      id: Not(IsNull()),
    };
    if (params.search) {
      where.title = ILike(`%${params.search}%`);
    }
    if (params.status !== undefined) {
      where.status = params.status;
    }
    if (params.type !== undefined) {
      where.type = params.type;
    }
    if (params.locationType !== undefined) {
      where.locationType = params.locationType;
    }
    if (params.createdBy !== undefined) {
      where.createdBy = { id: params.createdBy };
    }
    return where;
  }

  private async countCurrentMembers(
    storyIds: string[],
  ): Promise<Map<string, number>> {
    if (storyIds.length === 0) {
      return new Map();
    }

    const members = await this.storyMemberRepository.find({
      where: { story: { id: In(storyIds) } },
      select: { id: true, story: { id: true } },
      relations: { story: true },
    });

    const counts = new Map<string, number>();
    for (const member of members) {
      const storyId = member.story?.id;
      if (!storyId) {
        continue;
      }
      counts.set(storyId, (counts.get(storyId) ?? 0) + 1);
    }
    return counts;
  }
}
