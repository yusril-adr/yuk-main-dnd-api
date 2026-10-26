import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentEntityDto } from '@shared/dtos/entities/story/story-comment.entity.dto';
import type {
  TStoryCommentReactionCounts,
  TStoryCommentReactionSummary,
} from '../../types/story-comment-reaction.type';
import type { StoryCommentReactionTypeEnum } from '../../enums/story-comment-reaction-type.enum';

export type TStoryCommentActionList = {
  isCanUpdate: boolean;
  isCanDelete: boolean;
  isCanPin: boolean;
  isCanUnpin: boolean;
  isCanReact: boolean;
};

export class PaginateStoryCommentsItemOutput extends StoryCommentEntityDto {
  // Number of non-deleted replies.
  replyCount: number;
  reactionCounts: TStoryCommentReactionCounts;
  reactionCount: number;
  myReaction: StoryCommentReactionTypeEnum | null;
  actionList: TStoryCommentActionList;

  constructor(
    payload: TStoryComment,
    actionList: TStoryCommentActionList,
    avatarUrl: string | null,
    replyCount: number,
    reactions: TStoryCommentReactionSummary,
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

export class PaginateStoryCommentsOutput {
  public readonly data: PaginateStoryCommentsItemOutput[];
  public readonly count: number;

  constructor(
    comments: TStoryComment[],
    avatarUrls: (string | null)[],
    actionLists: TStoryCommentActionList[],
    replyCounts: number[],
    reactions: TStoryCommentReactionSummary[],
    count: number,
  ) {
    this.data = comments.map(
      (comment, i) =>
        new PaginateStoryCommentsItemOutput(
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
