import type { TEventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentEntityDto } from '@shared/dtos/entities/event/event-comment.entity.dto';
import type { TEventCommentActionList } from '../../types/event-comment-action-list.type';

export class PaginateEventCommentRepliesItemOutput extends EventCommentEntityDto {
  actionList: TEventCommentActionList;

  constructor(
    payload: TEventComment,
    actionList: TEventCommentActionList,
    avatarUrl: string | null,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.actionList = actionList;
  }
}

export class PaginateEventCommentRepliesOutput {
  public readonly data: PaginateEventCommentRepliesItemOutput[];
  public readonly count: number;

  constructor(
    replies: TEventComment[],
    avatarUrls: (string | null)[],
    actionLists: TEventCommentActionList[],
    count: number,
  ) {
    this.data = replies.map(
      (reply, i) =>
        new PaginateEventCommentRepliesItemOutput(
          reply,
          actionLists[i],
          avatarUrls[i],
        ),
    );
    this.count = count;
  }
}
