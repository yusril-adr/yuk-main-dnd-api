import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentEntityDto } from '@shared/dtos/entities/story/story-comment.entity.dto';
import type { TStoryCommentActionList } from '../../types/story-comment-action-list.type';

export class PaginateStoryCommentRepliesItemOutput extends StoryCommentEntityDto {
  actionList: TStoryCommentActionList;

  constructor(
    payload: TStoryComment,
    actionList: TStoryCommentActionList,
    avatarUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.actionList = actionList;
  }
}

export class PaginateStoryCommentRepliesOutput {
  public readonly data: PaginateStoryCommentRepliesItemOutput[];
  public readonly count: number;

  constructor(
    replies: TStoryComment[],
    avatarUrls: (string | null)[],
    actionLists: TStoryCommentActionList[],
    count: number,
  ) {
    this.data = replies.map(
      (reply, i) =>
        new PaginateStoryCommentRepliesItemOutput(
          reply,
          actionLists[i],
          avatarUrls[i],
        ),
    );
    this.count = count;
  }
}
