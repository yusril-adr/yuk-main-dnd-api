import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import dayjs from '@shared/utils/dayjs';

export type TStoryCommentAuthorDto = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export class StoryCommentEntityDto {
  id: string;
  parentId: string | null;
  // A deleted top-level comment that still has replies is returned as a
  // placeholder: isDeleted true, content and author null.
  isDeleted: boolean;
  content: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  author: TStoryCommentAuthorDto | null;
  createdAt: string;
  updatedAt: string;

  parseEntity(
    comment: TStoryComment,
    avatarUrl?: string | null,
  ): StoryCommentEntityDto {
    this.id = comment.id;
    this.parentId = comment.parentId ?? null;
    this.isDeleted = comment.deletedAt != null;
    this.content = this.isDeleted ? null : comment.content;
    this.isPinned = comment.pinnedAt != null;
    this.pinnedAt = comment.pinnedAt
      ? dayjs(comment.pinnedAt).toISOString()
      : null;
    this.author = this.isDeleted
      ? null
      : {
          id: comment.user.id,
          displayName: comment.user.deletedAt
            ? `${comment.user.displayName} (Deleted User)`
            : comment.user.displayName,
          username: comment.user.username ?? null,
          avatarUrl: avatarUrl ?? null,
        };
    this.createdAt = dayjs(comment.createdAt).toISOString();
    this.updatedAt = dayjs(comment.updatedAt).toISOString();

    return this;
  }
}
