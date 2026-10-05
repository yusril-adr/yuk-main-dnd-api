import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { FindManyOptions, FindOptionsWhere, ILike } from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Story } from '@entities/main/story/story.entity';
import {
  mergeEachWhereConditions,
  mergeWhereConditions,
} from '@shared/utils/common';
import { StoryRepository } from '../../repositories/story.repository';
import { StoryService } from '../../services/story.service';
import { PaginateStoriesQuery } from './paginate-stories.query';
import { PaginateStoriesOutput } from './paginate-stories.output';
import { PaginateStoriesInput } from './paginate-stories.input';

@QueryHandler(PaginateStoriesQuery)
export class PaginateStoriesHandler implements IQueryHandler<
  PaginateStoriesQuery,
  PaginateStoriesOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
  ) {}

  async execute(query: PaginateStoriesQuery): Promise<PaginateStoriesOutput> {
    const { params } = query;

    let findOptions: FindManyOptions<Story> = {
      order: {
        [camelCase(params.sortBy)]: params.order,
      },
    };

    findOptions = this.searchQuery(findOptions, params);
    findOptions = this.filterQuery(findOptions, params);

    const [stories, count] = await this.storyRepository.findAndCount({
      ...findOptions,
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
      take: params.perPage,
      skip: params.perPage * (params.page - 1),
    });

    return PaginateStoriesOutput.from(
      stories.map((story) => ({
        story,
        bannerUrl: this.storyService.resolveBannerUrl(story),
        avatarCreatorUrl: this.storyService.resolveAvatarCreatorUrl(story),
      })),
      count,
    );
  }

  private searchQuery(
    query: FindManyOptions<Story>,
    params: PaginateStoriesInput,
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
    params: PaginateStoriesInput,
  ): FindManyOptions<Story> {
    if (params.status !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        status: params.status,
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
    if (params.createdBy !== undefined) {
      query.where = mergeEachWhereConditions(query.where, {
        createdBy: { id: params.createdBy },
      });
    }
    return query;
  }
}
