import type { TEventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentEntityDto } from '@shared/dtos/entities/event/event-comment.entity.dto';
import type { TEventCommentActionList } from '../../types/event-comment-action-list.type';
import type {
  TEventCommentReactionCounts,
  TEventCommentReactionSummary,
} from '../../types/event-comment-reaction.type';
import type { EventCommentReactionTypeEnum } from '../../enums/event-comment-reaction-type.enum';

export class PaginateEventCommentRepliesItemOutput extends EventCommentEntityDto {
  reactionCounts: TEventCommentReactionCounts;
  reactionCount: number;
  myReaction: EventCommentReactionTypeEnum | null;
  actionList: TEventCommentActionList;

  constructor(
    payload: TEventComment,
    actionList: TEventCommentActionList,
    avatarUrl: string | null,
    reactions: TEventCommentReactionSummary,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.reactionCounts = reactions.reactionCounts;
    this.reactionCount = reactions.reactionCount;
    this.myReaction = reactions.myReaction;
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
    reactions: TEventCommentReactionSummary[],
    count: number,
  ) {
    this.data = replies.map(
      (reply, i) =>
        new PaginateEventCommentRepliesItemOutput(
          reply,
          actionLists[i],
          avatarUrls[i],
          reactions[i],
        ),
    );
    this.count = count;
  }
}
