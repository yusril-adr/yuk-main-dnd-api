import { NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { StoryService } from '../../../services/story.service';
import { FindOneStoryQuery } from './find-one-story.query';
import {
  FindOneStoryOutput,
  TStoryBoardDetailActionList,
} from './find-one-story.output';

@QueryHandler(FindOneStoryQuery)
export class FindOneStoryHandler implements IQueryHandler<
  FindOneStoryQuery,
  FindOneStoryOutput
> {
  constructor(
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storyService: StoryService,
  ) {}

  async execute(query: FindOneStoryQuery): Promise<FindOneStoryOutput> {
    const { id, user } = query;

    const membership = await this.storyMemberRepository.findOne({
      where: {
        user: { id: user.id },
        story: { id },
      },
      relations: {
        story: { createdBy: { avatarFile: true }, bannerFile: true },
      },
    });
    if (!membership?.story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    const story = membership.story;
    const actionList: TStoryBoardDetailActionList = {
      isCanViewPublic: this.storyService.isCanViewPublic(story),
    };

    return new FindOneStoryOutput(
      story,
      actionList,
      this.storyService.resolveBannerUrl(story),
      this.storyService.resolveAvatarCreatorUrl(story),
    );
  }
}
