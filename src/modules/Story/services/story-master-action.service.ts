import { Injectable } from '@nestjs/common';
import { Story } from '@entities/main/story/story.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { StoryStatusEnum } from '../enums/story-status.enum';
import { StoryPermissionService } from './story-permission.service';
import { StoryService } from './story.service';

@Injectable()
export class StoryMasterActionService {
  constructor(
    private readonly storyPermissionService: StoryPermissionService,
    private readonly storyService: StoryService,
  ) {}

  isCanCreate(user: TJWTPayload): boolean {
    return user.permissions?.includes(PermissionEnum.STORIES_CREATE) ?? false;
  }

  isCanUpdate(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      !this.storyService.isCancelledStory(story) &&
      story.status !== StoryStatusEnum.COMPLETED
    );
  }

  isCanPublish(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      !this.storyService.isCancelledStory(story) &&
      story.status === StoryStatusEnum.DRAFT
    );
  }

  isCanComplete(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      !this.storyService.isCancelledStory(story) &&
      story.status === StoryStatusEnum.PUBLISHED
    );
  }

  isCanCancel(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      !this.storyService.isCancelledStory(story) &&
      story.status === StoryStatusEnum.PUBLISHED
    );
  }

  isCanArchive(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) && story.status !== StoryStatusEnum.ARCHIVED
    );
  }

  isCanUnarchive(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      story.status === StoryStatusEnum.ARCHIVED &&
      story.statusBefore != null
    );
  }

  isCanDelete(story: Story, user: TJWTPayload): boolean {
    return this.storyPermissionService.canModify(
      story,
      user,
      PermissionEnum.STORIES_DELETE,
    );
  }

  isCanAddMembers(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      !this.storyService.isCancelledStory(story) &&
      story.status !== StoryStatusEnum.COMPLETED
    );
  }

  isCanRemoveMembers(story: Story, user: TJWTPayload): boolean {
    return (
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      ) &&
      !this.storyService.isCancelledStory(story) &&
      story.status !== StoryStatusEnum.COMPLETED
    );
  }
}
