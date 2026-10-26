import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { StoryStatusEnum } from '../../enums/story-status.enum';
import { StoryService } from '../../services/story.service';
import { StoryCommentActionService } from '../../services/story-comment-action.service';
import { FindOneStoryQuery } from './find-one-story.query';
import {
  FindOneStoryOutput,
  TStoryDetailActionList,
} from './find-one-story.output';

@QueryHandler(FindOneStoryQuery)
export class FindOneStoryHandler implements IQueryHandler<
  FindOneStoryQuery,
  FindOneStoryOutput
> {
  constructor(
    private readonly storyService: StoryService,
    private readonly storyCommentActionService: StoryCommentActionService,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
  ) {}

  async execute(query: FindOneStoryQuery): Promise<FindOneStoryOutput> {
    const { identifier, user } = query;

    const story = await this.storyService.findPublicByIdentifier(identifier, {
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
    });

    const bannerUrl = this.storyService.resolveBannerUrl(story);
    const avatarCreatorUrl = this.storyService.resolveAvatarCreatorUrl(story);

    let actionList: TStoryDetailActionList = {
      isCanJoin: false,
      isCanCancelJoin: false,
      isCanComment: this.storyCommentActionService.isCanComment(story, user),
    };
    if (user !== null && story.status === StoryStatusEnum.PUBLISHED) {
      const member = await this.storyMemberRepository.findOne({
        where: { story: { id: story.id }, user: { id: user.id } },
      });
      actionList = {
        ...actionList,
        isCanJoin: !member,
        isCanCancelJoin: Boolean(member),
      };
    }

    return new FindOneStoryOutput(
      story,
      actionList,
      bannerUrl,
      avatarCreatorUrl,
    );
  }
}
