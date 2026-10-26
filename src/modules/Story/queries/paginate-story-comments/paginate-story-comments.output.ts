import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentEntityDto } from '@shared/dtos/entities/story/story-comment.entity.dto';

export type TStoryCommentActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isCanPin: boolean;
  isCanUnpin: boolean;
};

export class PaginateStoryCommentsItemOutput extends StoryCommentEntityDto {
  actionList: TStoryCommentActionList;

  constructor(
    payload: TStoryComment,
    actionList: TStoryCommentActionList,
    avatarUrl?: string | null,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
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
    count: number,
  ) {
    this.data = comments.map(
      (comment, i) =>
        new PaginateStoryCommentsItemOutput(
          comment,
          actionLists[i],
          avatarUrls[i],
        ),
    );
    this.count = count;
  }
}
