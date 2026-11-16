import type { TEventCommentReaction } from '@entities/main/event/event-comment-reaction.entity';
import dayjs from '@shared/utils/dayjs';
import type { EventCommentReactionTypeEnum } from '../../enums/event-comment-reaction-type.enum';

export type TEventCommentReactionUserOutput = {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
};

export class PaginateEventCommentReactionsItemOutput {
  id: string;
  type: EventCommentReactionTypeEnum;
  createdAt: string;
  user: TEventCommentReactionUserOutput;

  constructor(payload: TEventCommentReaction, avatarUrl: string | null) {
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

export class PaginateEventCommentReactionsOutput {
  public readonly data: PaginateEventCommentReactionsItemOutput[];
  public readonly count: number;

  constructor(
    reactions: TEventCommentReaction[],
    avatarUrls: (string | null)[],
    count: number,
  ) {
    this.data = reactions.map(
      (reaction, i) =>
        new PaginateEventCommentReactionsItemOutput(reaction, avatarUrls[i]),
    );
    this.count = count;
  }
}
