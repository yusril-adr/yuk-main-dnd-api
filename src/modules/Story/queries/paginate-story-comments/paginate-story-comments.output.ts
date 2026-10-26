import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentEntityDto } from '@shared/dtos/entities/story/story-comment.entity.dto';

export type TStoryCommentActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isCanPin: boolean;
  isCanUnpin: boolean;
};

export class PaginateStoryCommentsItemOutput extends StoryCommentEntityDto {
  // Number of non-deleted replies.
  replyCount: number;
  actionList: TStoryCommentActionList;

  constructor(
    payload: TStoryComment,
    actionList: TStoryCommentActionList,
    avatarUrl: string | null,
    replyCount: number,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.replyCount = replyCount;
    this.actionList = actionList;
  }
}

export class PaginateStoryCommentsOutput {
  public readonly data: PaginateStoryCommentsItemOutput[];
  public readonly count: number;

  constructor(
    comments: TStoryComment[],
    avatarUrls: (string | null)[],
    actionLists: TStoryCommentActionList[],
    replyCounts: number[],
    count: number,
  ) {
    this.data = comments.map(
      (comment, i) =>
        new PaginateStoryCommentsItemOutput(
          comment,
          actionLists[i],
          avatarUrls[i],
          replyCounts[i],
        ),
    );
    this.count = count;
  }
}
