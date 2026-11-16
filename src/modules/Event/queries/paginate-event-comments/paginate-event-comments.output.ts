import type { TEventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentEntityDto } from '@shared/dtos/entities/event/event-comment.entity.dto';
import type {
  TEventCommentReactionCounts,
  TEventCommentReactionSummary,
} from '../../types/event-comment-reaction.type';
import type { EventCommentReactionTypeEnum } from '../../enums/event-comment-reaction-type.enum';
import type { TEventCommentActionList } from '../../types/event-comment-action-list.type';

export class PaginateEventCommentsItemOutput extends EventCommentEntityDto {
  // Number of non-deleted replies.
  replyCount: number;
  reactionCounts: TEventCommentReactionCounts;
  reactionCount: number;
  myReaction: EventCommentReactionTypeEnum | null;
  actionList: TEventCommentActionList;

  constructor(
    payload: TEventComment,
    actionList: TEventCommentActionList,
    avatarUrl: string | null,
    replyCount: number,
    reactions: TEventCommentReactionSummary,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.replyCount = replyCount;
    this.reactionCounts = reactions.reactionCounts;
    this.reactionCount = reactions.reactionCount;
    this.myReaction = reactions.myReaction;
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
    reactions: TEventCommentReactionSummary[],
    count: number,
  ) {
    this.data = comments.map(
      (comment, i) =>
        new PaginateEventCommentsItemOutput(
          comment,
          actionLists[i],
          avatarUrls[i],
          replyCounts[i],
          reactions[i],
        ),
    );
    this.count = count;
  }
}
