import type { TStoryCommentReaction } from '@entities/main/story/story-comment-reaction.entity';
import dayjs from '@shared/utils/dayjs';
import type { StoryCommentReactionTypeEnum } from '../../enums/story-comment-reaction-type.enum';

export type TStoryCommentReactionUserOutput = {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
};

export class PaginateStoryCommentReactionsItemOutput {
  id: string;
  type: StoryCommentReactionTypeEnum;
  createdAt: string;
  user: TStoryCommentReactionUserOutput;

  constructor(payload: TStoryCommentReaction, avatarUrl: string | null) {
    this.id = payload.id;
    this.type = payload.type;
    this.createdAt = dayjs(payload.createdAt).toISOString();

    const displayName = payload.user.deletedAt
      ? `${payload.user.displayName} (Deleted User)`
      : payload.user.displayName;

    this.user = {
      id: payload.user.id,
      displayName,
      username: payload.user.username,
      avatarUrl: avatarUrl ?? null,
      isGuest: payload.user.isGuest === true,
    };
  }
}

export class PaginateStoryCommentReactionsOutput {
  public readonly data: PaginateStoryCommentReactionsItemOutput[];
  public readonly count: number;

  constructor(
    reactions: TStoryCommentReaction[],
    avatarUrls: (string | null)[],
    count: number,
  ) {
    this.data = reactions.map(
      (reaction, i) =>
        new PaginateStoryCommentReactionsItemOutput(reaction, avatarUrls[i]),
    );
    this.count = count;
  }
}
