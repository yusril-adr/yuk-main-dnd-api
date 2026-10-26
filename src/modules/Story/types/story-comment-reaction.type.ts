import type { StoryCommentReactionTypeEnum } from '../enums/story-comment-reaction-type.enum';

export type TStoryCommentReactionCounts = {
  like: number;
  love: number;
  laugh: number;
  wow: number;
};

export type TStoryCommentReactionSummary = {
  reactionCounts: TStoryCommentReactionCounts;
  reactionCount: number;
  myReaction: StoryCommentReactionTypeEnum | null;
};
