import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentEntityDto } from '@shared/dtos/entities/story/story-comment.entity.dto';
import type { TStoryCommentActionList } from '../paginate-story-comments/paginate-story-comments.output';
import type {
  TStoryCommentReactionCounts,
  TStoryCommentReactionSummary,
} from '../../types/story-comment-reaction.type';
import type { StoryCommentReactionTypeEnum } from '../../enums/story-comment-reaction-type.enum';

export class PaginateStoryCommentRepliesItemOutput extends StoryCommentEntityDto {
  reactionCounts: TStoryCommentReactionCounts;
  reactionCount: number;
  myReaction: StoryCommentReactionTypeEnum | null;
  actionList: TStoryCommentActionList;

  constructor(
    payload: TStoryComment,
    actionList: TStoryCommentActionList,
    avatarUrl: string | null,
    reactions: TStoryCommentReactionSummary,
  ) {
    super();
    this.parseEntity(payload, avatarUrl);
    this.reactionCounts = reactions.reactionCounts;
    this.reactionCount = reactions.reactionCount;
    this.myReaction = reactions.myReaction;
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
    reactions: TStoryCommentReactionSummary[],
    count: number,
  ) {
    this.data = replies.map(
      (reply, i) =>
        new PaginateStoryCommentRepliesItemOutput(
          reply,
          actionLists[i],
          avatarUrls[i],
          reactions[i],
        ),
    );
    this.count = count;
  }
}
