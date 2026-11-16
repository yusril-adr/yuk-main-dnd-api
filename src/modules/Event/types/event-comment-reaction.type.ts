import type { EventCommentReactionTypeEnum } from '../enums/event-comment-reaction-type.enum';

export type TEventCommentReactionCounts = {
  like: number;
  love: number;
  laugh: number;
  wow: number;
};

export type TEventCommentReactionSummary = {
  reactionCounts: TEventCommentReactionCounts;
  reactionCount: number;
  myReaction: EventCommentReactionTypeEnum | null;
};
