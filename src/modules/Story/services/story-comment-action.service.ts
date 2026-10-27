import { Injectable } from '@nestjs/common';
import { Story } from '@entities/main/story/story.entity';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PUBLIC_STORY_STATUSES } from '../enums/story-status.enum';
import { StoryPermissionService } from './story-permission.service';

@Injectable()
export class StoryCommentActionService {
  constructor(
    private readonly storyPermissionService: StoryPermissionService,
  ) {}

  // Comments are listed on the public story page, so only stories that page
  // shows (published or completed) accept new comments.
  isCanComment(story: Story, user: TJWTPayload | null): boolean {
    return user !== null && PUBLIC_STORY_STATUSES.includes(story.status);
  }

  isCanReact(
    comment: StoryComment,
    story: Story,
    user: TJWTPayload | null,
  ): boolean {
    return comment.deletedAt == null && this.isCanComment(story, user);
  }

  isCanUpdate(comment: StoryComment, user: TJWTPayload | null): boolean {
    return (
      user !== null && comment.deletedAt == null && comment.user?.id === user.id
    );
  }

  isCanDelete(
    comment: StoryComment,
    story: Story,
    user: TJWTPayload | null,
  ): boolean {
    if (user === null || comment.deletedAt != null) {
      return false;
    }
    return (
      comment.user?.id === user.id ||
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_DELETE,
      )
    );
  }

  // Permission only. The pin and unpin handlers use this for their 403, so
  // both stay idempotent regardless of pinned state.
  hasPinPermission(story: Story, user: TJWTPayload | null): boolean {
    return (
      user !== null &&
      this.storyPermissionService.canModify(
        story,
        user,
        PermissionEnum.STORIES_UPDATE,
      )
    );
  }

  // Only live top-level comments can be pinned; replies never can.
  isCanManagePin(
    comment: StoryComment,
    story: Story,
    user: TJWTPayload | null,
  ): boolean {
    return (
      comment.parentId == null &&
      comment.deletedAt == null &&
      this.hasPinPermission(story, user)
    );
  }

  isCanPin(
    comment: StoryComment,
    story: Story,
    user: TJWTPayload | null,
  ): boolean {
    return (
      comment.pinnedAt == null && this.isCanManagePin(comment, story, user)
    );
  }

  isCanUnpin(
    comment: StoryComment,
    story: Story,
    user: TJWTPayload | null,
  ): boolean {
    return (
      comment.pinnedAt != null && this.isCanManagePin(comment, story, user)
    );
  }
}
