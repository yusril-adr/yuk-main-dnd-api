import type { TEventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentEntityDto } from '@shared/dtos/entities/event/event-comment.entity.dto';

import type { TEventCommentActionList } from '../../types/event-comment-action-list.type';
export class PaginateEventCommentsItemOutput extends EventCommentEntityDto {
  // Number of non-deleted replies.
  replyCount: number;
  actionList: TEventCommentActionList;

  constructor(
    payload: TEventComment,
    actionList: TEventCommentActionList,
    avatarUrl: string | null,
    replyCount: number,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.replyCount = replyCount;
    this.actionList = actionList;
  }
}

export class PaginateEventCommentsOutput {
  public readonly data: PaginateEventCommentsItemOutput[];
  public readonly count: number;

  constructor(
    comments: TEventComment[],
    avatarUrls: (string | null)[],
    actionLists: TEventCommentActionList[],
    replyCounts: number[],
    count: number,
  ) {
    this.data = comments.map(
      (comment, i) =>
        new PaginateEventCommentsItemOutput(
          comment,
          actionLists[i],
          avatarUrls[i],
          replyCounts[i],
        ),
    );
    this.count = count;
  }
}
