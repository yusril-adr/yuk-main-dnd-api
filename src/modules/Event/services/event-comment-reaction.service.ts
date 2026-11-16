import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentReaction } from '@entities/main/event/event-comment-reaction.entity';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { EventCommentReactionTypeEnum } from '../enums/event-comment-reaction-type.enum';
import type {
  TEventCommentReactionCounts,
  TEventCommentReactionSummary,
} from '../types/event-comment-reaction.type';

const COUNT_KEYS: Record<
  EventCommentReactionTypeEnum,
  keyof TEventCommentReactionCounts
> = {
  [EventCommentReactionTypeEnum.LIKE]: 'like',
  [EventCommentReactionTypeEnum.LOVE]: 'love',
  [EventCommentReactionTypeEnum.LAUGH]: 'laugh',
  [EventCommentReactionTypeEnum.WOW]: 'wow',
};

@Injectable()
export class EventCommentReactionService {
  constructor(
    @InjectRepository(EventCommentReaction)
    private readonly eventCommentReactionRepository: Repository<EventCommentReaction>,
  ) {}

  emptySummary(): TEventCommentReactionSummary {
    return {
      reactionCounts: { like: 0, love: 0, laugh: 0, wow: 0 },
      reactionCount: 0,
      myReaction: null,
    };
  }

  // Two grouped queries for the whole page: counts per type, and the
  // caller's own reactions. Deleted placeholders always get an empty summary.
  async getSummaries(
    comments: EventComment[],
    user: TJWTPayload | null,
  ): Promise<TEventCommentReactionSummary[]> {
    const ids = comments
      .filter((comment) => comment.deletedAt == null)
      .map((comment) => comment.id);
    const summaries = new Map(ids.map((id) => [id, this.emptySummary()]));

    if (ids.length > 0) {
      const counts = await this.eventCommentReactionRepository
        .createQueryBuilder('reaction')
        .select('reaction.comment_id', 'commentId')
        .addSelect('reaction.type', 'type')
        .addSelect('COUNT(*)::int', 'count')
        .where('reaction.comment_id IN (:...ids)', { ids })
        .groupBy('reaction.comment_id')
        .addGroupBy('reaction.type')
        .getRawMany<{ commentId: string; type: number; count: number }>();
      for (const row of counts) {
        const summary = summaries.get(row.commentId);
        const key =
          COUNT_KEYS[Number(row.type) as EventCommentReactionTypeEnum];
        if (summary && key) {
          summary.reactionCounts[key] = Number(row.count);
          summary.reactionCount += Number(row.count);
        }
      }

      if (user) {
        const mine = await this.eventCommentReactionRepository
          .createQueryBuilder('reaction')
          .select('reaction.comment_id', 'commentId')
          .addSelect('reaction.type', 'type')
          .where('reaction.comment_id IN (:...ids)', { ids })
          .andWhere('reaction.user_id = :userId', { userId: user.id })
          .getRawMany<{ commentId: string; type: number }>();
        for (const row of mine) {
          const summary = summaries.get(row.commentId);
          if (summary) {
            summary.myReaction = Number(row.type);
          }
        }
      }
    }

    return comments.map(
      (comment) => summaries.get(comment.id) ?? this.emptySummary(),
    );
  }
}
