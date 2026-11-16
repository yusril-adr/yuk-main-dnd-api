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
  content: string;
  isPinned: boolean;
  pinnedAt: string | null;
  author: TEventCommentAuthorDto;
  createdAt: string;
  updatedAt: string;

  parseEntity(
    comment: TEventComment,
    avatarUrl?: string | null,
  ): EventCommentEntityDto {
    this.id = comment.id;
    this.content = comment.content;
    this.isPinned = comment.pinnedAt != null;
    this.pinnedAt = comment.pinnedAt
      ? dayjs(comment.pinnedAt).toISOString()
      : null;
    this.author = {
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
