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
  content: string;
  isPinned: boolean;
  pinnedAt: string | null;
  author: TStoryCommentAuthorDto;
  createdAt: string;
  updatedAt: string;

  parseEntity(
    comment: TStoryComment,
    avatarUrl?: string | null,
  ): StoryCommentEntityDto {
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
