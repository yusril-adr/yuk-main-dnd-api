import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryService } from '../../../services/story.service';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { FindOneStoryQuery } from './find-one-story.query';
import {
  FindOneStoryOutput,
  TStoryMasterDetailActionList,
} from './find-one-story.output';

@QueryHandler(FindOneStoryQuery)
export class FindOneStoryHandler implements IQueryHandler<
  FindOneStoryQuery,
  FindOneStoryOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly storyService: StoryService,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(query: FindOneStoryQuery): Promise<FindOneStoryOutput> {
    const { id, user } = query;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: { avatarFile: true }, bannerFile: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    const actionList: TStoryMasterDetailActionList = {
      isCanUpdate: this.storyMasterActionService.isCanUpdate(story, user),
      isCanPublish: this.storyMasterActionService.isCanPublish(story, user),
      isCanComplete: this.storyMasterActionService.isCanComplete(story, user),
      isCanCancel: this.storyMasterActionService.isCanCancel(story, user),
      isCanArchive: this.storyMasterActionService.isCanArchive(story, user),
      isCanUnarchive: this.storyMasterActionService.isCanUnarchive(story, user),
      isCanDelete: this.storyMasterActionService.isCanDelete(story, user),
      isCanAddMembers: this.storyMasterActionService.isCanAddMembers(
        story,
        user,
      ),
      isCanRemoveMembers: this.storyMasterActionService.isCanRemoveMembers(
        story,
        user,
      ),
    };

    return new FindOneStoryOutput(
      story,
      actionList,
      this.storyService.resolveBannerUrl(story),
      this.storyService.resolveAvatarCreatorUrl(story),
    );
  }
}
