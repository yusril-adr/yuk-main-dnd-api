import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentReaction } from '@entities/main/story/story-comment-reaction.entity';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { StoryCommentReactionTypeEnum } from '../enums/story-comment-reaction-type.enum';
import type {
  TStoryCommentReactionCounts,
  TStoryCommentReactionSummary,
} from '../types/story-comment-reaction.type';

const COUNT_KEYS: Record<
  StoryCommentReactionTypeEnum,
  keyof TStoryCommentReactionCounts
> = {
  [StoryCommentReactionTypeEnum.LIKE]: 'like',
  [StoryCommentReactionTypeEnum.LOVE]: 'love',
  [StoryCommentReactionTypeEnum.LAUGH]: 'laugh',
  [StoryCommentReactionTypeEnum.WOW]: 'wow',
};

@Injectable()
export class StoryCommentReactionService {
  constructor(
    @InjectRepository(StoryCommentReaction)
    private readonly storyCommentReactionRepository: Repository<StoryCommentReaction>,
  ) {}

  emptySummary(): TStoryCommentReactionSummary {
    return {
      reactionCounts: { like: 0, love: 0, laugh: 0, wow: 0 },
      reactionCount: 0,
      myReaction: null,
    };
  }

  // Two grouped queries for the whole page: counts per type, and the
  // caller's own reactions. Deleted placeholders always get an empty summary.
  async getSummaries(
    comments: StoryComment[],
    user: TJWTPayload | null,
  ): Promise<TStoryCommentReactionSummary[]> {
    const ids = comments
      .filter((comment) => comment.deletedAt == null)
      .map((comment) => comment.id);
    const summaries = new Map(ids.map((id) => [id, this.emptySummary()]));

    if (ids.length > 0) {
      const counts = await this.storyCommentReactionRepository
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
          COUNT_KEYS[Number(row.type) as StoryCommentReactionTypeEnum];
        if (summary && key) {
          summary.reactionCounts[key] = Number(row.count);
          summary.reactionCount += Number(row.count);
        }
      }

      if (user) {
        const mine = await this.storyCommentReactionRepository
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
