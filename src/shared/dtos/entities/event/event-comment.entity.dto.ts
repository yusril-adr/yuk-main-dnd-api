import type { TEventComment } from '@entities/main/event/event-comment.entity';
import dayjs from '@shared/utils/dayjs';

export type TEventCommentAuthorDto = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export class EventCommentEntityDto {
  id: string;
  parentId: string | null;
  // A deleted top-level comment that still has replies is returned as a
  // placeholder: isDeleted true, content and author null.
  isDeleted: boolean;
  content: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  author: TEventCommentAuthorDto | null;
  createdAt: string;
  updatedAt: string;

  parseEntity(
    comment: TEventComment,
    avatarUrl?: string | null,
  ): EventCommentEntityDto {
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
