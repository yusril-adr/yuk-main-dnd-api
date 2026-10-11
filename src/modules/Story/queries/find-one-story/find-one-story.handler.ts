import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StoryMember } from '@entities/main/story/story-member.entity';
import {
  PUBLIC_STORY_STATUSES,
  StoryStatusEnum,
} from '../../enums/story-status.enum';
import { StoryRepository } from '../../repositories/story.repository';
import { StoryService } from '../../services/story.service';
import { FindOneStoryQuery } from './find-one-story.query';
import { FindOneStoryOutput } from './find-one-story.output';

@QueryHandler(FindOneStoryQuery)
export class FindOneStoryHandler implements IQueryHandler<
  FindOneStoryQuery,
  FindOneStoryOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
  ) {}

  async execute(query: FindOneStoryQuery): Promise<FindOneStoryOutput> {
    const { id, userId } = query;

    const story = await this.storyRepository.findOne({
      where: { id, status: In(PUBLIC_STORY_STATUSES) },
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    const bannerUrl = this.storyService.resolveBannerUrl(story);
    const avatarCreatorUrl = this.storyService.resolveAvatarCreatorUrl(story);

    let canJoin = false;
    if (
      userId !== null &&
      story.status === StoryStatusEnum.PUBLISHED &&
      story.createdBy?.id &&
      userId !== story.createdBy.id
    ) {
      const member = await this.storyMemberRepository.findOne({
        where: { story: { id }, user: { id: userId } },
      });
      canJoin = !member;
    }

    return new FindOneStoryOutput(story, bannerUrl, avatarCreatorUrl, canJoin);
  }
}
